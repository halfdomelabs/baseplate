import {
  quot,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import R from 'ramda';
import { ServiceContextProvider } from '@src/generators/core/service-context';
import {
  PrismaDataTransformer,
  PrismaDataTransformOutputField,
} from '@src/providers/prisma/prisma-data-transformable';
import { ServiceOutputDto } from '@src/types/serviceOutput';
import { notEmpty } from '@src/utils/array';
import { upperCaseFirst } from '@src/utils/case';
import { PrismaOutputProvider } from '../../prisma';
import { PrismaUtilsProvider } from '../../prisma-utils';

export interface PrismaDataMethodOptions {
  name: string;
  modelName: string;
  prismaFieldNames: string[];
  prismaOutput: PrismaOutputProvider;
  operationName: string;
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
  prismaUtils: PrismaUtilsProvider
): TypescriptCodeExpression {
  if (!pipeNames.length) {
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
    }
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
        `Could not find field ${fieldName} in model ${modelName}`
      );
    }
    return field;
  });
  const transformerFields = transformers.flatMap((transformer) =>
    transformer.inputFields.map((f) => f.dtoField)
  );
  return {
    name: `${modelName}${upperCaseFirst(operationName)}Data`,
    fields: [
      ...prismaFields.map((field) => {
        if (field.type !== 'scalar') {
          throw new Error(
            `Non-scalar fields not suppported in data method operation`
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
            : { isOptional: field.isOptional || field.hasDefault }),
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
  }: Omit<PrismaDataMethodOptions, 'name'>
): TypescriptCodeBlock {
  const prismaFieldSelection = prismaFieldNames
    .map((field) => `'${field}'`)
    .join(' | ');

  const transformerInputs = transformers.flatMap(
    (transformer) => transformer.inputFields
  );

  if (!transformerInputs.length) {
    return TypescriptCodeUtils.formatBlock(
      `type DATA_INPUT_TYPE_NAME = Pick<Prisma.PRISMA_DATA_INPUT, PRISMA_FIELDS>;`,
      {
        DATA_INPUT_TYPE_NAME: dataInputTypeName,
        PRISMA_DATA_INPUT: `${modelName}Unchecked${upperCaseFirst(
          operationName
        )}Input`,
        PRISMA_FIELDS: prismaFieldSelection,
      },
      { importText: [`import {Prisma} from '@prisma/client'`] }
    );
  }
  const customFields = R.mergeAll(
    transformers.flatMap((transformer) =>
      transformer.inputFields.map((f) => ({
        [`${f.dtoField.name}${f.dtoField.isOptional ? '?' : ''}`]: f.type,
      }))
    )
  );

  return TypescriptCodeUtils.formatBlock(
    `interface DATA_INPUT_TYPE_NAME extends Pick<Prisma.PRISMA_DATA_INPUT, PRISMA_FIELDS> {
  CUSTOM_FIELDS
}`,
    {
      DATA_INPUT_TYPE_NAME: dataInputTypeName,
      PRISMA_DATA_INPUT: `${modelName}Unchecked${upperCaseFirst(
        operationName
      )}Input`,
      PRISMA_FIELDS: prismaFieldSelection,
      CUSTOM_FIELDS:
        TypescriptCodeUtils.mergeBlocksAsInterfaceContent(customFields),
    },
    { importText: [`import {Prisma} from '@prisma/client'`] }
  );
}

export function getDataMethodDataExpressions({
  transformers,
  operationType,
  whereUniqueExpression,
  parentIdCheckField,
  prismaOutput,
  modelName,
}: Pick<
  PrismaDataMethodOptions,
  | 'prismaOutput'
  | 'modelName'
  | 'transformers'
  | 'operationType'
  | 'whereUniqueExpression'
  | 'parentIdCheckField'
>): {
  functionBody: TypescriptCodeBlock | string;
  createExpression: TypescriptCodeExpression;
  updateExpression: TypescriptCodeExpression;
  dataPipeNames: string[];
} {
  if (!transformers.length) {
    return {
      functionBody: '',
      createExpression: TypescriptCodeUtils.createExpression('data'),
      updateExpression: TypescriptCodeUtils.createExpression('data'),
      dataPipeNames: [],
    };
  }

  const customInputs = transformers.flatMap((t) =>
    t.inputFields.map((f) => f.dtoField.name)
  );

  const needsExistingItem = transformers.some((t) => t.needsExistingItem);

  const existingItemGetter = !needsExistingItem
    ? TypescriptCodeUtils.createBlock('')
    : TypescriptCodeUtils.formatBlock(
        `
const existingItem = OPTIONAL_WHERE
(await PRISMA_MODEL.findUnique({ where: WHERE_UNIQUE, rejectOnNotFound: true }))
`,
        {
          OPTIONAL_WHERE:
            // TODO: Make it a bit more flexible
            operationType === 'upsert' && whereUniqueExpression
              ? `${whereUniqueExpression} && `
              : '',
          PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
          WHERE_UNIQUE: whereUniqueExpression || '',
        }
      );

  const parentIdCheck =
    parentIdCheckField &&
    `
    if (existingItem && existingItem.${parentIdCheckField} !== parentId) {
      throw new Error('${modelName} not attached to the correct parent item');
    }
    `;

  const functionBody = TypescriptCodeUtils.formatBlock(
    `const { CUSTOM_INPUTS, ...rest } = data;

    EXISTING_ITEM_GETTER;

    PARENT_ID_CHECK;
     
TRANSFORMERS;`,
    {
      CUSTOM_INPUTS: customInputs.join(', '),
      EXISTING_ITEM_GETTER: existingItemGetter,
      PARENT_ID_CHECK: parentIdCheck ?? '',
      TRANSFORMERS: TypescriptCodeUtils.mergeBlocks(
        transformers.flatMap((t) => t.outputFields.map((f) => f.transformer)),
        '\n\n'
      ),
    }
  );

  function createExpressionEntries(
    expressionExtractor: (
      field: PrismaDataTransformOutputField
    ) => TypescriptCodeExpression | string | undefined
  ): TypescriptCodeExpression {
    const dataExpressionEntries = [
      ...transformers.flatMap((t) =>
        t.outputFields.map((f): [string, TypescriptCodeExpression | string] => [
          f.name,
          expressionExtractor(f) ||
            (f.pipeOutputName ? `${f.pipeOutputName}.data` : f.name),
        ])
      ),
      ['...', 'rest'] as [string, string],
    ];

    return TypescriptCodeUtils.mergeExpressionsAsObject(
      R.fromPairs(dataExpressionEntries)
    );
  }

  const createExpression = createExpressionEntries((f) => f.createExpression);

  const updateExpression = createExpressionEntries((f) => f.updateExpression);

  return {
    functionBody,
    createExpression,
    updateExpression,
    dataPipeNames: transformers.flatMap((t) =>
      t.outputFields.map((f) => f.pipeOutputName).filter(notEmpty)
    ),
  };
}
