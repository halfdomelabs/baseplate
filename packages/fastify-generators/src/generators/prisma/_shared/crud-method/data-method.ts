import type {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { safeMergeAllWithOptions } from '@halfdomelabs/utils';

import type { ServiceContextProvider } from '@src/generators/core/service-context/index.js';
import type {
  PrismaDataTransformer,
  PrismaDataTransformOutputField,
} from '@src/providers/prisma/prisma-data-transformable.js';
import type { PrismaOutputRelationField } from '@src/types/prisma-output.js';
import type { ServiceOutputDto } from '@src/types/service-output.js';

import { notEmpty } from '@src/utils/array.js';
import { upperCaseFirst } from '@src/utils/case.js';

import type { PrismaUtilsProvider } from '../../prisma-utils/prisma-utils.generator.js';
import type { PrismaOutputProvider } from '../../prisma/prisma.generator.js';

export interface PrismaDataMethodOptions {
  name: string;
  modelName: string;
  prismaFieldNames: string[];
  prismaOutput: PrismaOutputProvider;
  operationName: 'create' | 'update';
  operationType: 'create' | 'upsert' | 'update';
  whereUniqueExpression: string | null;
  // optionally check parent ID matches existing item
  parentIdCheckField?: string;
  isPartial: boolean;
  transformers: PrismaDataTransformer[];
  serviceContext: ServiceContextProvider;
  prismaUtils: PrismaUtilsProvider;
}

export function getDataMethodContextRequired({
  transformers,
}: Pick<PrismaDataMethodOptions, 'transformers'>): boolean {
  return transformers.some((t) => t.needsContext);
}

export function wrapWithApplyDataPipe(
  operation: TypescriptCodeExpression,
  pipeNames: string[],
  prismaUtils: PrismaUtilsProvider,
): TypescriptCodeExpression {
  if (pipeNames.length === 0) {
    return operation;
  }
  return TypescriptCodeUtils.formatExpression(
    `applyDataPipeOutput(PIPE_NAMES, OPERATION)`,
    {
      PIPE_NAMES: `[${pipeNames.join(', ')}]`,
      OPERATION: operation,
    },
    {
      importText: [
        "import {applyDataPipeOutput} from '%prisma-utils/dataPipes'",
      ],
      importMappers: [prismaUtils],
    },
  );
}

export function getDataMethodDataType({
  modelName,
  prismaFieldNames,
  prismaOutput,
  operationName,
  isPartial,
  transformers,
}: Omit<PrismaDataMethodOptions, 'name'>): ServiceOutputDto {
  const prismaDefinition = prismaOutput.getPrismaModel(modelName);
  const prismaFields = prismaFieldNames.map((fieldName) => {
    const field = prismaDefinition.fields.find((f) => f.name === fieldName);
    if (!field) {
      throw new Error(
        `Could not find field ${fieldName} in model ${modelName}`,
      );
    }
    return field;
  });
  const transformerFields = transformers.flatMap((transformer) =>
    transformer.inputFields.map((f) => f.dtoField),
  );
  return {
    name: `${modelName}${upperCaseFirst(operationName)}Data`,
    fields: [
      ...prismaFields.map((field) => {
        if (field.type !== 'scalar') {
          throw new Error(
            `Non-scalar fields not suppported in data method operation`,
          );
        }
        return {
          type: 'scalar' as const,
          name: field.name,
          isList: field.isList,
          scalarType: field.scalarType,
          enumType: field.enumType
            ? prismaOutput.getServiceEnum(field.enumType)
            : undefined,
          ...(isPartial
            ? { isOptional: true, isNullable: field.isOptional }
            : {
                isOptional: field.isOptional || field.hasDefault,
                isNullable: field.isOptional,
              }),
        };
      }),
      ...transformerFields,
    ],
  };
}

export function getDataInputTypeBlock(
  dataInputTypeName: string,
  {
    modelName,
    prismaFieldNames,
    operationName,
    transformers,
  }: Omit<PrismaDataMethodOptions, 'name'>,
): TypescriptCodeBlock {
  const prismaFieldSelection = prismaFieldNames
    .map((field) => `'${field}'`)
    .join(' | ');

  const transformerInputs = transformers.flatMap(
    (transformer) => transformer.inputFields,
  );

  let prismaDataInput = `Prisma.${modelName}UncheckedCreateInput`;
  prismaDataInput =
    operationName === 'create'
      ? prismaDataInput
      : `Partial<${prismaDataInput}>`;

  if (transformerInputs.length === 0) {
    return TypescriptCodeUtils.formatBlock(
      `type DATA_INPUT_TYPE_NAME = Pick<PRISMA_DATA_INPUT, PRISMA_FIELDS>;`,
      {
        DATA_INPUT_TYPE_NAME: dataInputTypeName,
        PRISMA_DATA_INPUT: prismaDataInput,
        PRISMA_FIELDS: prismaFieldSelection,
      },
      { importText: [`import {Prisma} from '@prisma/client'`] },
    );
  }
  const customFields = safeMergeAllWithOptions(
    transformers.flatMap((transformer) =>
      transformer.inputFields.map((f) => ({
        [`${f.dtoField.name}${f.dtoField.isOptional ? '?' : ''}`]: f.type,
      })),
    ),
  );

  return TypescriptCodeUtils.formatBlock(
    `interface DATA_INPUT_TYPE_NAME extends Pick<PRISMA_DATA_INPUT, PRISMA_FIELDS> {
  CUSTOM_FIELDS
}`,
    {
      DATA_INPUT_TYPE_NAME: dataInputTypeName,
      PRISMA_DATA_INPUT: prismaDataInput,
      PRISMA_FIELDS: prismaFieldSelection,
      CUSTOM_FIELDS:
        TypescriptCodeUtils.mergeBlocksAsInterfaceContent(customFields),
    },
    { importText: [`import {Prisma} from '@prisma/client'`] },
  );
}

export function getDataMethodDataExpressions({
  transformers,
  operationType,
  whereUniqueExpression,
  parentIdCheckField,
  prismaOutput,
  modelName,
  prismaFieldNames,
  prismaUtils,
}: Pick<
  PrismaDataMethodOptions,
  | 'prismaOutput'
  | 'modelName'
  | 'transformers'
  | 'operationType'
  | 'whereUniqueExpression'
  | 'parentIdCheckField'
  | 'prismaFieldNames'
  | 'prismaUtils'
>): {
  functionBody: TypescriptCodeBlock | string;
  createExpression: TypescriptCodeExpression;
  updateExpression: TypescriptCodeExpression;
  dataPipeNames: string[];
} {
  if (transformers.length === 0) {
    return {
      functionBody: '',
      createExpression: TypescriptCodeUtils.createExpression('data'),
      updateExpression: TypescriptCodeUtils.createExpression('data'),
      dataPipeNames: [],
    };
  }

  // if there are transformers, try to use the CheckedDataInput instead of Unchecked to allow nested creations
  const outputModel = prismaOutput.getPrismaModel(modelName);
  const relationFields = outputModel.fields.filter(
    (field): field is PrismaOutputRelationField =>
      field.type === 'relation' &&
      !!field.fields &&
      field.fields.some((relationScalarField) =>
        prismaFieldNames.includes(relationScalarField),
      ),
  );

  const relationTransformers = relationFields.map(
    (field): PrismaDataTransformer => {
      const relationScalarFields = field.fields ?? [];
      const missingFields = relationScalarFields.filter(
        (f) => !prismaFieldNames.includes(f),
      );
      if (missingFields.length > 0) {
        throw new Error(
          `Relation named ${
            field.name
          } requires all fields as inputs (missing ${missingFields.join(
            ', ',
          )})`,
        );
      }

      // create pseudo-transformer for relation fields
      const transformerPrefix =
        operationType === 'update' || field.isOptional
          ? `${relationScalarFields
              .map((f) => `${f} == null`)
              .join(' || ')} ? ${
              operationType === 'create'
                ? 'undefined'
                : relationScalarFields.join(' && ')
            } : `
          : '';

      const foreignModel = prismaOutput.getPrismaModel(field.modelType);
      const foreignIdFields = foreignModel.idFields;

      if (!foreignIdFields?.length) {
        throw new Error(`Foreign model has to have primary key`);
      }

      const uniqueWhereValue = TypescriptCodeUtils.mergeExpressionsAsObject(
        Object.fromEntries(
          foreignIdFields.map((idField): [string, string] => {
            const idx = field.references?.findIndex(
              (refName) => refName === idField,
            );
            if (idx == null || idx === -1) {
              throw new Error(
                `Relation ${field.name} must have a reference to the primary key of ${field.modelType}`,
              );
            }
            const localField = relationScalarFields[idx];
            return [idField, localField];
          }),
        ),
      );

      const uniqueWhere =
        foreignIdFields.length > 1
          ? uniqueWhereValue.wrap(
              (contents) => `{ ${foreignIdFields.join('_')}: ${contents}}`,
            )
          : uniqueWhereValue;

      const transformer = TypescriptCodeUtils.formatBlock(
        'const FIELD_NAME = TRANSFORMER_PREFIX { connect: UNIQUE_WHERE }',
        {
          FIELD_NAME: field.name,
          TRANSFORMER_PREFIX: transformerPrefix,
          UNIQUE_WHERE: uniqueWhere,
        },
      );

      return {
        inputFields: relationScalarFields.map((f) => ({
          type: TypescriptCodeUtils.createExpression(''),
          dtoField: { name: f, type: 'scalar', scalarType: 'string' },
        })),
        outputFields: [
          {
            name: field.name,
            transformer,
            createExpression:
              operationType === 'upsert'
                ? `${field.name} || undefined`
                : undefined,
            updateExpression: field.isOptional
              ? TypescriptCodeUtils.createExpression(
                  `createPrismaDisconnectOrConnectData(${field.name})`,
                  'import {createPrismaDisconnectOrConnectData} from "%prisma-utils/prismaRelations"',
                  { importMappers: [prismaUtils] },
                )
              : undefined,
          },
        ],
        isAsync: false,
      };
    },
  );

  const augmentedTransformers = [...transformers, ...relationTransformers];

  const customInputs = augmentedTransformers.flatMap((t) =>
    t.inputFields.map((f) => f.dtoField.name),
  );

  const needsExistingItem =
    operationType !== 'create' &&
    augmentedTransformers.some((t) => t.needsExistingItem);

  const existingItemGetter = needsExistingItem
    ? TypescriptCodeUtils.formatBlock(
        `
const existingItem = OPTIONAL_WHERE
(await PRISMA_MODEL.findUniqueOrThrow({ where: WHERE_UNIQUE }))
`,
        {
          OPTIONAL_WHERE:
            // TODO: Make it a bit more flexible
            operationType === 'upsert' && whereUniqueExpression
              ? `${whereUniqueExpression} && `
              : '',
          PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
          WHERE_UNIQUE: whereUniqueExpression ?? '',
        },
      )
    : TypescriptCodeUtils.createBlock('');

  const parentIdCheck =
    parentIdCheckField &&
    `
    if (existingItem && existingItem.${parentIdCheckField} !== parentId) {
      throw new Error('${modelName} not attached to the correct parent item');
    }
    `;

  const functionBody = TypescriptCodeUtils.formatBlock(
    `const { CUSTOM_INPUTS, ...rest } = data;

    EXISTING_ITEM_GETTER

    PARENT_ID_CHECK
     
TRANSFORMERS`,
    {
      CUSTOM_INPUTS: customInputs.join(', '),
      EXISTING_ITEM_GETTER: existingItemGetter,
      PARENT_ID_CHECK: parentIdCheck ?? '',
      TRANSFORMERS: TypescriptCodeUtils.mergeBlocks(
        augmentedTransformers
          .flatMap((t) => t.outputFields.map((f) => f.transformer))
          .filter(notEmpty),
        '\n\n',
      ),
    },
  );

  function createExpressionEntries(
    expressionExtractor: (
      field: PrismaDataTransformOutputField,
    ) => TypescriptCodeExpression | string | undefined,
  ): TypescriptCodeExpression {
    const dataExpressionEntries = [
      ...augmentedTransformers.flatMap((t) =>
        t.outputFields.map((f): [string, TypescriptCodeExpression | string] => [
          f.name,
          expressionExtractor(f) ??
            (f.pipeOutputName ? `${f.pipeOutputName}.data` : f.name),
        ]),
      ),
      ['...', 'rest'] as [string, string],
    ];

    return TypescriptCodeUtils.mergeExpressionsAsObject(
      Object.fromEntries(dataExpressionEntries),
    );
  }

  const createExpression = createExpressionEntries((f) => f.createExpression);

  const updateExpression = createExpressionEntries((f) => f.updateExpression);

  return {
    functionBody,
    createExpression,
    updateExpression,
    dataPipeNames: transformers.flatMap((t) =>
      t.outputFields.map((f) => f.pipeOutputName).filter(notEmpty),
    ),
  };
}
