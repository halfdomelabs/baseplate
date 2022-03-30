import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { serviceFileProvider } from '@src/generators/core/service-file';
import {
  prismaDataTransformableProvider,
  PrismaDataTransformer,
} from '@src/providers/prisma/prisma-data-transformable';
import {
  prismaToServiceOutputDto,
  ServiceOutputMethod,
} from '@src/types/serviceOutput';
import {
  getDataInputTypeBlock,
  getDataMethodDataExpressions,
  getDataMethodDataType,
  PrismaDataMethodOptions,
} from '../_shared/crud-method/data-method';
import { prismaOutputProvider } from '../prisma';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  modelName: yup.string().required(),
  prismaFields: yup.array(yup.string().required()).required(),
});

function getMethodDefinition(
  serviceMethodExpression: TypescriptCodeExpression,
  options: PrismaDataMethodOptions
): ServiceOutputMethod {
  const { name, modelName, prismaOutput } = options;
  const prismaDefinition = prismaOutput.getPrismaModel(modelName);

  const dataType = getDataMethodDataType(options);
  return {
    name,
    expression: serviceMethodExpression,
    arguments: [
      {
        name: 'id',
        type: 'scalar',
        scalarType: 'uuid',
      },
      {
        name: 'data',
        type: 'nested',
        nestedType: dataType,
      },
    ],
    returnType: prismaToServiceOutputDto(prismaDefinition),
  };
}

function getMethodExpression(
  options: PrismaDataMethodOptions
): TypescriptCodeExpression {
  const { name, modelName, prismaOutput } = options;

  const updateInputTypeName = `${modelName}UpdateData`;

  const typeHeaderBlock = getDataInputTypeBlock(updateInputTypeName, options);

  const { functionBody, dataExpression } =
    getDataMethodDataExpressions(options);

  const modelType = prismaOutput.getModelTypeExpression(modelName);

  return TypescriptCodeUtils.formatExpression(
    `
async METHOD_NAME(id: string, data: UPDATE_INPUT_TYPE_NAME): Promise<MODEL_TYPE> {
  FUNCTION_BODY
  return PRISMA_MODEL.update(UPDATE_ARGS);
}
`.trim(),
    {
      METHOD_NAME: name,
      UPDATE_INPUT_TYPE_NAME: updateInputTypeName,
      MODEL_TYPE: modelType,
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
      FUNCTION_BODY: functionBody,
      UPDATE_ARGS: TypescriptCodeUtils.mergeExpressionsAsObject({
        where: new TypescriptCodeExpression('{ id }'),
        data: dataExpression,
      }),
    },
    {
      headerBlocks: [typeHeaderBlock],
    }
  );
}

const PrismaCrudUpdateGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    serviceFile: serviceFileProvider.dependency().modifiedInBuild(),
  },
  exports: {
    prismaDataTransformable: prismaDataTransformableProvider,
  },
  createGenerator(descriptor, { prismaOutput, serviceFile }) {
    const { name, modelName, prismaFields } = descriptor;
    const serviceMethodExpression = serviceFile
      .getServiceExpression()
      .append(`.${name}`);
    const transformers: PrismaDataTransformer[] = [];

    return {
      getProviders: () => ({
        prismaDataTransformable: {
          addTransformer(transformer) {
            transformers.push(transformer);
          },
        },
      }),
      build: () => {
        const methodOptions: PrismaDataMethodOptions = {
          name,
          modelName,
          prismaFieldNames: prismaFields,
          prismaOutput,
          operationName: 'update',
          isPartial: true,
          transformers,
        };

        serviceFile.registerMethod(
          name,
          getMethodExpression(methodOptions),
          getMethodDefinition(serviceMethodExpression, methodOptions)
        );
      },
    };
  },
});

export default PrismaCrudUpdateGenerator;
