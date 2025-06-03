import type {
  TsCodeFragment,
  TsHoistedFragment,
} from '@baseplate-dev/core-generators';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsTemplate,
  tsTypeImportBuilder,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { notEmpty, quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import type {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
  PrismaDataTransformInputField,
} from '#src/providers/prisma/prisma-data-transformable.js';
import type {
  PrismaOutputModel,
  PrismaOutputRelationField,
} from '#src/types/prisma-output.js';

import { serviceContextImportsProvider } from '#src/generators/core/service-context/service-context.generator.js';
import { upperCaseFirst } from '#src/utils/case.js';

import type { PrismaDataMethodOptions } from '../_shared/crud-method/data-method.js';
import type { PrismaUtilsImportsProvider } from '../prisma-utils/prisma-utils.generator.js';
import type { PrismaOutputProvider } from '../prisma/prisma.generator.js';

import {
  getDataInputTypeBlock,
  getDataMethodDataExpressions,
  getDataMethodDataType,
} from '../_shared/crud-method/data-method.js';
import {
  prismaCrudServiceProvider,
  prismaCrudServiceSetupProvider,
} from '../prisma-crud-service/prisma-crud-service.generator.js';
import { prismaUtilsImportsProvider } from '../prisma-utils/prisma-utils.generator.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  inputName: z.string().optional(),
  localRelationName: z.string().optional(),
  embeddedFieldNames: z.array(z.string().min(1)),
  foreignModelName: z.string().optional(),
  embeddedTransformerNames: z.array(z.string().min(1)).optional(),
});

function getForeignModelRelation(
  prismaOutput: PrismaOutputProvider,
  modelName: string,
  localRelationName: string,
): {
  localModel: PrismaOutputModel;
  foreignModel: PrismaOutputModel;
  localRelation: PrismaOutputRelationField;
  foreignRelation: PrismaOutputRelationField;
} {
  const localModel = prismaOutput.getPrismaModel(modelName);
  const localRelation = localModel.fields.find(
    (f) => f.name === localRelationName,
  );

  if (!localRelation || localRelation.type !== 'relation') {
    throw new Error(
      `${modelName}.${localRelationName} is not a relation field`,
    );
  }

  // find the relationship on the foreign model since that's where the details of the relation exist
  const foreignModel = prismaOutput.getPrismaModel(localRelation.modelType);
  const foreignRelation = foreignModel.fields.find(
    (f): f is PrismaOutputRelationField =>
      f.type === 'relation' &&
      (localRelation.relationName
        ? f.name === localRelation.relationName
        : f.modelType === modelName),
  );

  if (!foreignRelation) {
    throw new Error(
      `Could not find foreign relation on ${localRelation.modelType} for ${modelName}.${localRelationName}`,
    );
  }

  return { localModel, foreignModel, localRelation, foreignRelation };
}

interface EmbeddedTransformFunctionOutput {
  name: string;
  func: TsHoistedFragment;
}

function createEmbeddedTransformFunction(options: {
  name: string;
  inputDataType: string;
  outputDataType: string;
  dataMethodOptions: Omit<PrismaDataMethodOptions, 'name'>;
  prismaUtils: PrismaUtilsImportsProvider;
  serviceContextType: TsCodeFragment;
  isOneToOne?: boolean;
  whereUniqueType: string;
}): EmbeddedTransformFunctionOutput {
  const {
    name,
    inputDataType,
    outputDataType,
    serviceContextType,
    prismaUtils,
    isOneToOne,
    dataMethodOptions,
    whereUniqueType,
  } = options;

  dataMethodOptions.prismaOutput.getPrismaModel(dataMethodOptions.modelName);

  const isAsync = dataMethodOptions.transformers.some((t) => t.isAsync);

  const { functionBody, createExpression, updateExpression, dataPipeNames } =
    getDataMethodDataExpressions(dataMethodOptions);

  const outputPipeType = tsCodeFragment(
    `DataPipeOutput<${outputDataType}>`,
    prismaUtils.DataPipeOutput.typeDeclaration(),
  );
  const outputType = isAsync
    ? tsTemplate`Promise<${outputPipeType}>`
    : outputPipeType;

  // get a primary key to add a dummy where unique (since create operations don't have a whereunique)
  const prismaModel = options.dataMethodOptions.prismaOutput.getPrismaModel(
    options.dataMethodOptions.modelName,
  );

  const primaryKey = prismaModel.idFields?.[0];
  if (!primaryKey) {
    throw new Error(
      `Model ${options.dataMethodOptions.modelName} must have at least one primary key`,
    );
  }

  const func = TsCodeUtils.formatFragment(
    `${
      isAsync ? 'async ' : ''
    }function FUNC_NAME(data: INPUT_DATA_TYPE, context: CONTEXT_TYPE, whereUnique?: WHERE_UNIQUE_TYPE, parentId?: string): OUTPUT_TYPE {
      FUNCTION_BODY

      return DATA_RESULT;
    }`,
    {
      FUNC_NAME: name,
      INPUT_DATA_TYPE: inputDataType,
      FUNCTION_BODY: functionBody,
      WHERE_UNIQUE_TYPE: whereUniqueType,
      DATA_RESULT: TsCodeUtils.mergeFragmentsAsObject({
        data: TsCodeUtils.mergeFragmentsAsObject({
          where: isOneToOne
            ? undefined
            : `whereUnique ?? { ${primaryKey}: '' }`,
          create: createExpression,
          update: updateExpression,
        }),
        operations:
          dataPipeNames.length === 0
            ? undefined
            : tsCodeFragment(
                `mergePipeOperations([${dataPipeNames.join(', ')}])`,
                prismaUtils.mergePipeOperations.declaration(),
              ),
      }),
      OUTPUT_TYPE: outputType,
      CONTEXT_TYPE: serviceContextType,
    },
  );

  return {
    name,
    func: tsHoistedFragment(`embedded-transform-${name}`, func),
  };
}

export const embeddedRelationTransformerGenerator = createGenerator({
  name: 'prisma/embedded-relation-transformer',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: ({
    name: localRelationName,
    embeddedFieldNames = [],
    embeddedTransformerNames,
    inputName: inputNameDescriptor,
    foreignModelName,
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        prismaCrudServiceSetup: prismaCrudServiceSetupProvider,
        foreignCrudService: prismaCrudServiceProvider
          .dependency()
          .optionalReference(foreignModelName),
        serviceContextImports: serviceContextImportsProvider,
        prismaUtilsImports: prismaUtilsImportsProvider,
      },
      run({
        prismaOutput,
        prismaCrudServiceSetup,
        foreignCrudService,
        serviceContextImports,
        prismaUtilsImports,
      }) {
        function buildTransformer({
          operationType,
        }: PrismaDataTransformerOptions): PrismaDataTransformer {
          const modelName = prismaCrudServiceSetup.getModelName();
          const inputName = inputNameDescriptor ?? localRelationName;

          const { localModel, foreignModel, localRelation, foreignRelation } =
            getForeignModelRelation(prismaOutput, modelName, localRelationName);

          if (localModel.idFields?.length !== 1) {
            throw new Error(
              `${modelName} must have exactly one id field if used in an embedded relation`,
            );
          }
          const localId = localModel.idFields[0];

          if (embeddedTransformerNames && !foreignCrudService) {
            throw new Error(
              `Cannot use embedded transformers without a foreign crud service`,
            );
          }

          const isOneToOne = !localRelation.isList;

          // get transformers
          const embeddedTransformerFactories =
            embeddedTransformerNames
              ?.map((name) => foreignCrudService?.getTransformerByName(name))
              .filter(notEmpty) ?? [];

          const embeddedFields = embeddedFieldNames.map((name) => {
            const field = foreignModel.fields.find((f) => f.name === name);
            if (!field) {
              throw new Error(
                `Could not find field ${name} on ${foreignModel.name}`,
              );
            }
            if (field.type !== 'scalar') {
              throw new Error(
                `Field ${name} on ${foreignModel.name} is not a scalar`,
              );
            }
            return field;
          });

          const dataInputName = `${modelName}Embedded${upperCaseFirst(
            localRelationName,
          )}Data`;

          const upsertTransformers = embeddedTransformerFactories.map(
            (factory) => factory.buildTransformer({ operationType: 'upsert' }),
          );

          // If we use the existing item, we should check that its ID is actually owned
          // by the parent
          const getForeignRelationParentField = (): string => {
            // figure out which field is parent ID
            const foreignParentIdx = foreignRelation.references?.findIndex(
              (reference) => reference === localId,
            );
            // foreign parent ID is not in list
            if (foreignParentIdx == null || foreignParentIdx === -1) {
              throw new Error(
                `Foreign reference must contain primary key of local model`,
              );
            }
            const foreignParentField =
              foreignRelation.fields?.[foreignParentIdx];
            if (!foreignParentField) {
              throw new Error(`Unable to find foreign parent field`);
            }
            return foreignParentField;
          };

          const dataMethodOptions: Omit<PrismaDataMethodOptions, 'name'> = {
            modelName: foreignModel.name,
            prismaFieldNames: embeddedFields.map((f) => f.name),
            operationName: 'create',
            transformers: upsertTransformers,
            prismaOutput,
            isPartial: false,
            serviceContextImports,
            prismaUtils: prismaUtilsImports,
            operationType: 'upsert',
            whereUniqueExpression: 'whereUnique',
            parentIdCheckField: upsertTransformers.some(
              (t) => t.needsExistingItem,
            )
              ? getForeignRelationParentField()
              : undefined,
          };

          const foreignModelName = upperCaseFirst(foreignModel.name);
          const foreignRelationName = upperCaseFirst(foreignRelation.name);
          const outputDataType = `{
        where${
          isOneToOne ? '?' : ''
        }: Prisma.${foreignModelName}WhereUniqueInput;
        create: Prisma.${foreignModelName}CreateWithout${foreignRelationName}Input;
        update: Prisma.${foreignModelName}UpdateWithout${foreignRelationName}Input;
      }`;

          const upsertFunction =
            embeddedTransformerFactories.length === 0
              ? undefined
              : createEmbeddedTransformFunction({
                  name: `prepareUpsertEmbedded${upperCaseFirst(
                    localRelationName,
                  )}Data`,
                  inputDataType: dataInputName,
                  outputDataType,
                  dataMethodOptions,
                  isOneToOne,
                  prismaUtils: prismaUtilsImports,
                  serviceContextType:
                    serviceContextImports.ServiceContext.typeFragment(),
                  whereUniqueType: `Prisma.${upperCaseFirst(
                    foreignModel.name,
                  )}WhereUniqueInput`,
                });

          const dataInputType = getDataInputTypeBlock(
            dataInputName,
            dataMethodOptions,
          );
          const dataMethodDataType = getDataMethodDataType(dataMethodOptions);

          const isNullable =
            !localRelation.isList && operationType === 'update';

          const inputField: PrismaDataTransformInputField = {
            type: tsCodeFragment(
              `${dataInputName}${localRelation.isList ? '[]' : ''}${
                isNullable ? ' | null' : ''
              }`,
              undefined,
              {
                hoistedFragments: [dataInputType],
              },
            ),
            dtoField: {
              name: inputName,
              isOptional: true,
              isNullable,
              type: 'nested',
              isList: localRelation.isList,
              nestedType: {
                name: dataInputName,
                fields: dataMethodDataType.fields,
              },
            },
          };

          /**
           * This is a fairly complex piece of logic. We have the following scenarios:
           *
           * Update/Create:
           *  - Update operation
           *  - Create operation
           *
           * Relationship Type:
           *  - 1:many relationship
           *  - 1:1 relationship
           *
           * Data Preprocessing:
           *  - May have transform function
           *  - May have no transform function
           */

          const embeddedCallExpression = (() => {
            if (operationType === 'create') {
              return isOneToOne
                ? prismaUtilsImports.createOneToOneCreateData.fragment()
                : prismaUtilsImports.createOneToManyCreateData.fragment();
            }
            return isOneToOne
              ? prismaUtilsImports.createOneToOneUpsertData.fragment()
              : prismaUtilsImports.createOneToManyUpsertData.fragment();
          })();

          // finds the discriminator ID field in the input for 1:many relationships
          const getDiscriminatorIdField = (): string => {
            const foreignIds = foreignModel.idFields ?? [];
            const discriminatorIdFields = foreignIds.filter((foreignId) =>
              embeddedFieldNames.includes(foreignId),
            );

            if (discriminatorIdFields.length !== 1) {
              throw new Error(
                `Expected 1 discriminator ID field for ${localRelationName}, found ${discriminatorIdFields.length}`,
              );
            }
            return discriminatorIdFields[0];
          };

          const getWhereUniqueFunction = (): {
            func: TsCodeFragment;
            needsExistingItem: boolean;
          } => {
            const returnType = tsCodeFragment(
              `Prisma.${upperCaseFirst(
                foreignModel.name,
              )}WhereUniqueInput | undefined`,
              tsTypeImportBuilder(['Prisma']).from('@prisma/client'),
            );

            // convert primary keys to where unique
            const foreignIds = foreignModel.idFields ?? [];
            const primaryKeyFields = foreignIds.map(
              (
                idField,
              ): {
                name: string;
                value: string;
                requiredInputField?: string; // we may require some input fields to be specified
                usesInput?: boolean;
                needsExistingItem?: boolean;
              } => {
                // check if ID field is in relation
                const idRelationIdx = foreignRelation.fields?.findIndex(
                  (relationField) => relationField === idField,
                );
                if (idRelationIdx != null && idRelationIdx !== -1) {
                  const localField =
                    foreignRelation.references?.[idRelationIdx];
                  if (!localField) {
                    throw new Error(
                      `Could not find corresponding relation field for ${idField}`,
                    );
                  }
                  // short-circuit case for updates
                  if (operationType === 'update' && localId === localField) {
                    return { name: idField, value: localId };
                  }
                  return {
                    name: idField,
                    value: `existingItem.${localField}`,
                    needsExistingItem: true,
                  };
                }
                // check if ID field is in input
                const embeddedField = embeddedFields.find(
                  (f) => f.name === idField,
                );
                if (embeddedField) {
                  return {
                    name: idField,
                    value: `input.${idField}`,
                    usesInput: true,
                    requiredInputField:
                      embeddedField.isOptional || embeddedField.hasDefault
                        ? idField
                        : undefined,
                  };
                }
                throw new Error(
                  `Could not find ID field ${idField} in either embedded object or relation for relation ${localRelationName} of ${modelName}`,
                );
              },
            );

            const primaryKeyExpression = TsCodeUtils.mergeFragmentsAsObject(
              Object.fromEntries(
                primaryKeyFields.map((keyField): [string, string] => [
                  keyField.name,
                  keyField.value,
                ]),
              ),
              { wrapWithParenthesis: true },
            );

            const value =
              primaryKeyFields.length > 1
                ? TsCodeUtils.mergeFragmentsAsObject(
                    {
                      [foreignIds.join('_')]: primaryKeyExpression,
                    },
                    { wrapWithParenthesis: true },
                  )
                : primaryKeyExpression;

            const usesInput = primaryKeyFields.some((k) => k.usesInput);
            const needsExistingItem = primaryKeyFields.some(
              (k) => k.needsExistingItem,
            );

            const requirementsList = [
              ...(needsExistingItem && operationType === 'upsert'
                ? ['existingItem']
                : []),
              ...primaryKeyFields
                .map(
                  (f) =>
                    f.requiredInputField && `input.${f.requiredInputField}`,
                )
                .filter(notEmpty),
            ];

            return {
              func: TsCodeUtils.formatFragment(
                `(INPUT): RETURN_TYPE => VALUE`,
                {
                  INPUT: usesInput ? 'input' : '',
                  RETURN_TYPE: returnType,
                  PREFIX: '',
                  VALUE:
                    requirementsList.length > 0
                      ? tsTemplate`${requirementsList.join(' && ')} ? ${value} : undefined`
                      : value,
                },
              ),
              needsExistingItem,
            };
          };

          const embeddedCallArgs = ((): {
            args: TsCodeFragment;
            needsExistingItem?: boolean;
          } => {
            if (operationType === 'create') {
              return {
                args: TsCodeUtils.mergeFragmentsAsObject({
                  input: inputName,
                  transform: upsertFunction?.name,
                  context: upsertFunction && 'context',
                }),
              };
            }
            const whereUniqueResult = getWhereUniqueFunction();

            const parentId =
              operationType === 'update' ? localId : `existingItem.${localId}`;

            const transformAdditions = upsertFunction
              ? {
                  transform: upsertFunction.name,
                  context: 'context',
                  getWhereUnique: whereUniqueResult.func,
                  parentId,
                }
              : {};

            const oneToManyAdditions = isOneToOne
              ? {}
              : {
                  idField: quot(getDiscriminatorIdField()),
                  getWhereUnique: whereUniqueResult.func,
                };

            const parentField = getForeignRelationParentField();

            const oneToOneAdditions = isOneToOne
              ? {
                  deleteRelation: TsCodeUtils.formatFragment(
                    '() => PRISMA_MODEL.deleteMany({ where: WHERE_ARGS })',
                    {
                      PRISMA_MODEL: prismaOutput.getPrismaModelFragment(
                        foreignModel.name,
                      ),
                      WHERE_ARGS: TsCodeUtils.mergeFragmentsAsObject({
                        [parentField]: parentId,
                      }),
                    },
                  ),
                }
              : {};

            return {
              args: TsCodeUtils.mergeFragmentsAsObject({
                input: inputName,
                ...transformAdditions,
                ...oneToManyAdditions,
                ...oneToOneAdditions,
              }),
              needsExistingItem:
                whereUniqueResult.needsExistingItem ||
                (operationType === 'upsert' && !!upsertFunction),
            };
          })();

          const outputName = `${localRelationName}Output`;

          const transformer = TsCodeUtils.formatFragment(
            `const OUTPUT_NAME = await EMBEDDED_CALL(ARGS)`,
            {
              OUTPUT_NAME: outputName,
              EMBEDDED_CALL: embeddedCallExpression,
              ARGS: embeddedCallArgs.args,
            },
            [],
            { hoistedFragments: upsertFunction ? [upsertFunction.func] : [] },
          );

          return {
            inputFields: [inputField],
            outputFields: [
              {
                name: localRelationName,
                pipeOutputName: outputName,
                transformer,
                createExpression: `{ create: ${outputName}.data?.create }`,
              },
            ],
            needsExistingItem: embeddedCallArgs.needsExistingItem,
            isAsync: true,
            needsContext: !!upsertFunction,
          };
        }

        prismaCrudServiceSetup.addTransformer(localRelationName, {
          buildTransformer,
        });

        return {};
      },
    }),
  }),
});
