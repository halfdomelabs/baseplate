import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { serviceFileProvider } from '@src/generators/core/service-file';
import {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
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
import { prismaCrudServiceProvider } from '../prisma-crud-service';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  modelName: yup.string().required(),
  prismaFields: yup.array(yup.string().required()).required(),
  transformerNames: yup.array(yup.string().required()),
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

  const createInputTypeName = `${modelName}CreateData`;

  const typeHeaderBlock = getDataInputTypeBlock(createInputTypeName, options);

  const { functionBody, dataExpression } =
    getDataMethodDataExpressions(options);

  const modelType = prismaOutput.getModelTypeExpression(modelName);

  return TypescriptCodeUtils.formatExpression(
    `
async METHOD_NAME(data: CREATE_INPUT_TYPE_NAME): Promise<MODEL_TYPE> {
  FUNCTION_BODY

  return PRISMA_MODEL.create(CREATE_ARGS);
}
`.trim(),
    {
      METHOD_NAME: name,
      CREATE_INPUT_TYPE_NAME: createInputTypeName,
      MODEL_TYPE: modelType,
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
      FUNCTION_BODY: functionBody,
      CREATE_ARGS: TypescriptCodeUtils.mergeExpressionsAsObject({
        data: dataExpression,
      }),
    },
    {
      headerBlocks: [typeHeaderBlock],
    }
  );
}

const PrismaCrudCreateGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    serviceFile: serviceFileProvider.dependency().modifiedInBuild(),
    crudPrismaService: prismaCrudServiceProvider,
  },
  createGenerator(
    descriptor,
    { prismaOutput, serviceFile, crudPrismaService }
  ) {
    const { name, modelName, prismaFields, transformerNames } = descriptor;
    const serviceMethodExpression = serviceFile
      .getServiceExpression()
      .append(`.${name}`);
    const transformerOption: PrismaDataTransformerOptions = {
      isUpdate: false,
    };
    const transformers: PrismaDataTransformer[] =
      transformerNames?.map((transformerName) =>
        crudPrismaService
          .getTransformerByName(transformerName)
          .buildTransformer(transformerOption)
      ) || [];

    return {
      getProviders: () => ({}),
      build: () => {
        const methodOptions: PrismaDataMethodOptions = {
          name,
          modelName,
          prismaFieldNames: prismaFields,
          prismaOutput,
          operationName: 'create',
          isPartial: false,
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

export default PrismaCrudCreateGenerator;
