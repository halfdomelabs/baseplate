import {
  tsUtilsProvider,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
  PrismaDataTransformInputField,
} from '@src/providers/prisma/prisma-data-transformable';
import {
  PrismaOutputModel,
  PrismaOutputRelationField,
} from '@src/types/prismaOutput';
import { notEmpty } from '@src/utils/array';
import { lowerCaseFirst, upperCaseFirst } from '@src/utils/case';
import {
  getDataInputTypeBlock,
  getDataMethodDataExpressions,
  getDataMethodDataType,
  PrismaDataMethodOptions,
} from '../_shared/crud-method/data-method';
import { getPrimaryKeyExpressions } from '../_shared/crud-method/primary-key-input';
import { PrismaOutputProvider, prismaOutputProvider } from '../prisma';
import {
  prismaCrudServiceProvider,
  prismaCrudServiceSetupProvider,
} from '../prisma-crud-service';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  inputName: yup.string(),
  localRelationName: yup.string(),
  embeddedFieldNames: yup.array().of(yup.string().required()),
  foreignCrudServiceRef: yup.string(),
  embeddedTransformerNames: yup.array().of(yup.string().required()),
});

function getForeignModelRelation(
  prismaOutput: PrismaOutputProvider,
  modelName: string,
  localRelationName: string
): {
  localModel: PrismaOutputModel;
  foreignModel: PrismaOutputModel;
  localRelation: PrismaOutputRelationField;
  foreignRelation: PrismaOutputRelationField;
} {
  const localModel = prismaOutput.getPrismaModel(modelName);
  const localRelation = localModel.fields.find(
    (f) => f.name === localRelationName
  );

  if (!localRelation || localRelation.type !== 'relation') {
    throw new Error(
      `${modelName}.${localRelationName} is not a relation field`
    );
  }

  // find the relationship on the foreign model since that's where the details of the relation exist
  const foreignModel = prismaOutput.getPrismaModel(localRelation.modelType);
  const foreignRelation = foreignModel.fields.find(
    (f): f is PrismaOutputRelationField =>
      f.type === 'relation' &&
      (localRelation.relationName
        ? f.name === localRelation.relationName
        : f.modelType === modelName)
  );

  if (!foreignRelation) {
    throw new Error(
      `Could not find foreign relation on ${localRelation.modelType} for ${modelName}.${localRelationName}`
    );
  }

  return { localModel, foreignModel, localRelation, foreignRelation };
}

interface EmbeddedTransformFunctionOutput {
  name: string;
  func: TypescriptCodeBlock;
  isAsync: boolean;
  primaryArgType?: string;
}

function createEmbeddedTransformFunction(options: {
  name: string;
  model: PrismaOutputModel;
  inputDataType: string;
  outputDataType: string;
  isUpdate: boolean;
  transformers: PrismaDataTransformer[];
}): EmbeddedTransformFunctionOutput {
  const { name, model, inputDataType, outputDataType, isUpdate, transformers } =
    options;

  const isAsync = transformers.some((t) => t.isAsync);

  const primaryKeyExpression = isUpdate
    ? getPrimaryKeyExpressions(model)
    : undefined;

  const primaryKeyArg = !primaryKeyExpression
    ? ''
    : `${primaryKeyExpression.argument}, `;
  const dataMethodExpressions = getDataMethodDataExpressions({ transformers });

  const outputType = isAsync ? `Promise<${outputDataType}>` : outputDataType;

  const func = TypescriptCodeUtils.formatBlock(
    `${
      isAsync ? 'async ' : ''
    }function ${name}(${primaryKeyArg}data: ${inputDataType}): ${outputType} {
      FUNCTION_BODY
      return DATA_RESULT;
    }`,
    {
      FUNCTION_BODY: dataMethodExpressions.functionBody,
      DATA_RESULT: dataMethodExpressions.dataExpression,
    }
  );

  return {
    name,
    func,
    isAsync: transformers.some((t) => t.isAsync),
    primaryArgType: primaryKeyExpression?.argumentType,
  };
}

function makeCreateFunctionCall(
  createFunction: EmbeddedTransformFunctionOutput | undefined,
  dataArg: string,
  isList: boolean
): string {
  let transformedInput = dataArg;

  if (createFunction) {
    if (isList) {
      transformedInput = `${dataArg}.map(${createFunction.name})`;
      if (createFunction.isAsync) {
        transformedInput = `await Promise.all(${transformedInput})`;
      }
    } else {
      transformedInput = `${createFunction.name}(${dataArg})`;
      if (createFunction.isAsync) {
        transformedInput = `await ${transformedInput}`;
      }
    }
  }
  return transformedInput;
}

function makeUpdateFunctionCall(
  updateFunction: EmbeddedTransformFunctionOutput | undefined,
  dataArg: string,
  isList: boolean,
  idArg: string,
  forceCastIdArgument?: boolean
): string {
  let transformedInput = dataArg;

  if (updateFunction) {
    const forceCast = forceCastIdArgument
      ? ` as ${updateFunction.primaryArgType || 'unknown'}`
      : '';
    if (isList) {
      transformedInput = `${dataArg}.map(d => ${updateFunction.name}(${idArg}${forceCast}, d))`;
      if (updateFunction.isAsync) {
        transformedInput = `await Promise.all(${transformedInput})`;
      }
    } else {
      transformedInput = `${updateFunction.name}(${idArg}${forceCast}, ${dataArg})`;
      if (updateFunction.isAsync) {
        transformedInput = `await ${transformedInput}`;
      }
    }
  }
  return transformedInput;
}

const EmbeddedRelationTransformerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    prismaCrudServiceSetup: prismaCrudServiceSetupProvider,
    foreignCrudService: prismaCrudServiceProvider.dependency().optional(),
    tsUtils: tsUtilsProvider,
  },
  populateDependencies: (dependencies, { foreignCrudServiceRef }) => ({
    ...dependencies,
    foreignCrudService: foreignCrudServiceRef
      ? dependencies.foreignCrudService.reference(foreignCrudServiceRef)
      : dependencies.foreignCrudService.resolveToNull(),
  }),
  createGenerator(
    {
      name: localRelationName,
      embeddedFieldNames = [],
      embeddedTransformerNames,
      inputName: inputNameDescriptor,
    },
    { prismaOutput, prismaCrudServiceSetup, foreignCrudService, tsUtils }
  ) {
    function buildTransformer({
      isUpdate,
    }: PrismaDataTransformerOptions): PrismaDataTransformer {
      const modelName = prismaCrudServiceSetup.getModelName();
      const inputName = inputNameDescriptor || localRelationName;

      const { localModel, foreignModel, localRelation, foreignRelation } =
        getForeignModelRelation(prismaOutput, modelName, localRelationName);

      if (localModel.idFields?.length !== 1) {
        throw new Error(
          `${modelName} must have exactly one id field if used in an embedded relation`
        );
      }
      const localId = localModel.idFields[0];

      if (embeddedTransformerNames && !foreignCrudService) {
        throw new Error(
          `Cannot use embedded transformers without a foreign crud service`
        );
      }

      // get transformers
      const embeddedTransformerFactories =
        embeddedTransformerNames
          ?.map((name) => foreignCrudService?.getTransformerByName(name))
          .filter(notEmpty) || [];

      const embeddedFields = embeddedFieldNames.map((name) => {
        const field = foreignModel.fields.find((f) => f.name === name);
        if (!field) {
          throw new Error(
            `Could not find field ${name} on ${foreignModel.name}`
          );
        }
        if (field.type !== 'scalar') {
          throw new Error(
            `Field ${name} on ${foreignModel.name} is not a scalar`
          );
        }
        return field;
      });

      const dataInputName = `${modelName}Embedded${upperCaseFirst(
        localRelationName
      )}Data`;

      const createTransformers = embeddedTransformerFactories.map((factory) =>
        factory.buildTransformer({ isUpdate: false })
      );

      const createFunction = !embeddedTransformerFactories.length
        ? undefined
        : createEmbeddedTransformFunction({
            name: `transformCreateEmbedded${upperCaseFirst(
              localRelationName
            )}Data`,
            model: foreignModel,
            inputDataType: dataInputName,
            outputDataType: `Prisma.${upperCaseFirst(
              foreignModel.name
            )}CreateWithout${upperCaseFirst(foreignRelation.name)}Input`,
            isUpdate: false,
            transformers: createTransformers,
          });

      const dataMethodOptions: Omit<PrismaDataMethodOptions, 'name'> = {
        modelName: foreignModel.name,
        prismaFieldNames: embeddedFields.map((f) => f.name),
        operationName: 'create',
        transformers: createTransformers,
        prismaOutput,
        isPartial: false,
      };

      const dataInputType = getDataInputTypeBlock(
        dataInputName,
        dataMethodOptions
      ).withHeaderKey(dataInputName);
      const dataMethodDataType = getDataMethodDataType(dataMethodOptions);

      const inputField: PrismaDataTransformInputField = {
        type: TypescriptCodeUtils.createExpression(
          `${dataInputName}${localRelation.isList ? '[]' : ''}`,
          undefined,
          {
            headerBlocks: [dataInputType],
          }
        ),
        dtoField: {
          name: inputName,
          isOptional: true,
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
       * Primary Key:
       *  - Compound key w/ one ID field being present in foreign relation - 1:many only
       *  - Single ID field not present in foreign relation (e.g. independent id field like TodoList and Todo items) - 1:1 or 1:many
       *  - Single ID field present in foreign relation (1:1 relation) - 1:1 only
       *
       * Primary Key autogenerated:
       *  - Primary key is autogenerated (e.g. item has auto-generated ID)
       *  - Primary key is not autogenerated (e.g. user ID, role name)
       *
       * Transformers:
       *  - May have embedded transformers with async
       *  - May have embedded transformers without async
       *  - May not have embedded transformers
       *
       * Note: 1:1 relations whose single ID field is not present in foreign relations are not supported with embedded transformers
       *  (because of the difficulty in determining the ID field name during an update operation)
       */
      let transformer: TypescriptCodeBlock;
      let usesNotEmpty = false;
      let isAsync = createTransformers.some((t) => t.isAsync);
      const headerBlocks = createFunction ? [createFunction.func] : [];

      // Update / Create
      if (!isUpdate) {
        // Create operation
        const prismaCreateNestedName = `Prisma.${
          foreignModel.name
        }CreateNested${
          localRelation.isList ? 'Many' : 'One'
        }Without${upperCaseFirst(foreignRelation.name)}Input`;

        const transformedInput = makeCreateFunctionCall(
          createFunction,
          inputName,
          localRelation.isList
        );

        transformer = TypescriptCodeUtils.createBlock(
          `const ${localRelationName}Input: ${prismaCreateNestedName} | undefined = ${inputName} && { create: ${transformedInput} };`
        );
      } else {
        // Update operation
        if (!foreignModel.idFields?.length) {
          throw new Error(`${foreignModel.name} does not have id fields`);
        }
        const { idFields: foreignIds } = foreignModel;
        if (foreignIds.length > 2) {
          throw new Error(`${foreignModel.name} needs two or fewer ID fields`);
        }

        const prismaUpdateName = `Prisma.${foreignModel.name}Update${
          localRelation.isList ? 'Many' : 'One'
        }Without${upperCaseFirst(foreignRelation.name)}Input`;

        const foreignVar = lowerCaseFirst(foreignModel.name);

        const updateTransformers = embeddedTransformerFactories.map((factory) =>
          factory.buildTransformer({ isUpdate: true })
        );

        const updateFunction = !embeddedTransformerFactories.length
          ? undefined
          : createEmbeddedTransformFunction({
              name: `transformUpdateEmbedded${upperCaseFirst(
                localRelationName
              )}Data`,
              model: foreignModel,
              inputDataType: dataInputName,
              outputDataType: `Prisma.${upperCaseFirst(
                foreignModel.name
              )}UpdateWithout${upperCaseFirst(foreignRelation.name)}Input`,
              isUpdate: true,
              transformers: updateTransformers,
            });
        if (updateFunction) {
          headerBlocks.push(updateFunction.func);
          isAsync = isAsync || updateTransformers.some((t) => t.isAsync);
        }

        let transformerPayload = '';

        if (!localRelation.isList) {
          // 1:1 relations
          if (foreignIds.length !== 1) {
            throw new Error(
              `A 1:1 relation ${localRelationName} must only have a single unique ID field`
            );
          }

          const primaryIdsInRelation = foreignModel.idFields.filter((id) =>
            foreignRelation.fields?.includes(id)
          );
          if (updateFunction && primaryIdsInRelation.length !== 1) {
            throw new Error(
              `Need exactly one primary key that is part of relation ${foreignRelation.name} in ${foreignModel.name} if using embedded transformers in 1:1 relation`
            );
          }

          const singleCreateInput = makeCreateFunctionCall(
            createFunction,
            inputName,
            false
          );
          const singleUpdateInput = makeUpdateFunctionCall(
            updateFunction,
            inputName,
            false,
            localId,
            false
          );

          // TODO: Do we want to consider making input nullable to unset it?
          transformerPayload = `{ upsert: { create: ${singleCreateInput}, update: ${singleUpdateInput} } }`;
        } else {
          // 1:many relations
          const primaryIdsNotInRelation = foreignModel.idFields.filter(
            (id) => !foreignRelation.fields?.includes(id)
          );
          if (primaryIdsNotInRelation.length !== 1) {
            throw new Error(
              `Need exactly one primary key that is not part of relation ${foreignRelation.name} in ${foreignModel.name}`
            );
          }
          const primaryIdNotInRelation = primaryIdsNotInRelation[0];
          const primaryFieldNotInRelation = foreignModel.fields.find(
            (f) => f.name === primaryIdNotInRelation
          );
          if (!primaryFieldNotInRelation) {
            throw new Error(
              `Could not find primary key ${primaryIdNotInRelation} in ${foreignModel.name}`
            );
          }
          const isPrimaryIdAutoGenerated = primaryFieldNotInRelation.hasDefault;

          const primaryIdsInRelation = foreignModel.idFields.filter((id) =>
            foreignRelation.fields?.includes(id)
          );
          if (primaryIdsInRelation.length > 1) {
            throw new Error(
              `Need exactly zero or one primary key that is part of relation ${foreignRelation.name} in ${foreignModel.name}`
            );
          }
          const primaryIdInRelation: string | undefined =
            primaryIdsInRelation[0];

          // Delete all items that are not in the input

          if (isPrimaryIdAutoGenerated) {
            usesNotEmpty = true;
          }
          const deleteClause = `
          deleteMany: {
            ${primaryIdNotInRelation}: { notIn: ${inputName}.map(${foreignVar} => ${foreignVar}.${primaryIdNotInRelation})${
            isPrimaryIdAutoGenerated ? '.filter(notEmpty)' : ''
          } },
          },`;

          // Upsert items that are in the input with all primary keys

          const primaryKeyName = foreignModel.idFields.join('_');

          const upsertFilter = !isPrimaryIdAutoGenerated
            ? ''
            : `.filter(${foreignVar} => ${foreignVar}.${primaryIdNotInRelation} !== undefined)`;

          const upsertPrimaryKey =
            foreignModel.idFields.length === 1
              ? `${foreignVar}.${primaryIdNotInRelation}`
              : `{ ${primaryIdInRelation}: ${localId}, ${primaryIdNotInRelation}: ${foreignVar}.${primaryIdNotInRelation} }`;

          const createSingleCall = makeCreateFunctionCall(
            createFunction,
            foreignVar,
            false
          );
          const updateSingleCall = makeUpdateFunctionCall(
            updateFunction,
            foreignVar,
            false,
            upsertPrimaryKey,
            isPrimaryIdAutoGenerated
          );

          let upsertClauseContents = `
          ${inputName}${upsertFilter}.map(${
            isAsync ? 'async ' : ''
          }${foreignVar} => ({
            where: { ${primaryKeyName}: ${upsertPrimaryKey} },
            create: ${createSingleCall},
            update: ${updateSingleCall},
          }))
          `;

          if (isAsync) {
            upsertClauseContents = `await Promise.all(${upsertClauseContents})`;
          }

          const upsertClause = `upsert: ${upsertClauseContents},`;

          // Create items that are in the input with no primary key specified

          const createClauseInput = makeCreateFunctionCall(
            createFunction,
            `${inputName}.filter(${foreignVar} => ${foreignVar}.${primaryIdNotInRelation} === undefined)`,
            true
          );

          const createClause = !isPrimaryIdAutoGenerated
            ? ''
            : `create: ${createClauseInput},`;

          transformerPayload = `{
            ${[deleteClause, upsertClause, createClause]
              .map((str) => str.trim())
              .filter(notEmpty)
              .join('\n')}
          }`;
        }

        transformer = TypescriptCodeUtils.createBlock(
          `const ${localRelationName}Input: ${prismaUpdateName} | undefined = ${inputName} && ${transformerPayload};`,
          [
            usesNotEmpty
              ? `import { notEmpty } from '%ts-utils/arrays'`
              : undefined,
            `import { Prisma } from '@prisma/client'`,
          ].filter(notEmpty),
          {
            importMappers: [tsUtils],
            headerBlocks,
          }
        );
      }

      return {
        inputFields: [inputField],
        outputFields: [
          {
            name: localRelationName,
            outputVariableName: `${localRelationName}Input`,
          },
        ],
        transformer,
        isAsync, // TODO!!!
      };
    }

    prismaCrudServiceSetup.addTransformer(localRelationName, {
      buildTransformer,
    });

    return {
      build: async () => {},
    };
  },
});

export default EmbeddedRelationTransformerGenerator;
