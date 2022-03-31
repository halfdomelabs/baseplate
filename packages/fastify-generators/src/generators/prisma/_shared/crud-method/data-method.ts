import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { capitalize } from 'inflection';
import R from 'ramda';
import { PrismaDataTransformer } from '@src/providers/prisma/prisma-data-transformable';
import { ServiceOutputDto } from '@src/types/serviceOutput';
import { PrismaOutputProvider } from '../../prisma';

export interface PrismaDataMethodOptions {
  name: string;
  modelName: string;
  prismaFieldNames: string[];
  prismaOutput: PrismaOutputProvider;
  operationName: string;
  isPartial: boolean;
  transformers: PrismaDataTransformer[];
}

export function getDataMethodDataType({
  modelName,
  prismaFieldNames,
  prismaOutput,
  operationName,
  isPartial,
  transformers,
}: PrismaDataMethodOptions): ServiceOutputDto {
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
    name: `${modelName}${capitalize(operationName)}Data`,
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
  }: PrismaDataMethodOptions
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
        PRISMA_DATA_INPUT: `${modelName}Unchecked${capitalize(
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
      PRISMA_DATA_INPUT: `${modelName}Unchecked${capitalize(
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
}: PrismaDataMethodOptions): {
  functionBody: TypescriptCodeBlock | string;
  dataExpression: TypescriptCodeExpression;
} {
  if (!transformers.length) {
    return {
      functionBody: '',
      dataExpression: TypescriptCodeUtils.createExpression('data'),
    };
  }

  const customInputs = transformers.flatMap((t) =>
    t.inputFields.map((f) => f.dtoField.name)
  );

  const functionBody = TypescriptCodeUtils.formatBlock(
    `const { CUSTOM_INPUTS, ...rest } = data;
     
TRANSFORMERS;`,
    {
      CUSTOM_INPUTS: customInputs.join(', '),
      TRANSFORMERS: TypescriptCodeUtils.mergeBlocks(
        transformers.map((t) => t.transformer),
        '\n\n'
      ),
    }
  );

  const customOutputs = transformers.flatMap((t) =>
    t.outputFields.map((f) =>
      f.outputVariableName ? `${f.name}: ${f.outputVariableName}` : f.name
    )
  );

  const dataExpression = TypescriptCodeUtils.formatExpression(
    `{ CUSTOM_OUTPUTS, ...rest }`,
    {
      CUSTOM_OUTPUTS: customOutputs.join(', '),
    }
  );

  return { functionBody, dataExpression };
}
