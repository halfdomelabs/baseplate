import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { serviceFileProvider } from '@src/generators/core/service-file';
import {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
} from '@src/providers/prisma/prisma-data-transformable';
import {
  prismaToServiceOutputDto,
  ServiceOutputMethod,
} from '@src/types/serviceOutput';
import { notEmpty } from '@src/utils/array';
import {
  getDataInputTypeBlock,
  getDataMethodDataExpressions,
  getDataMethodDataType,
  PrismaDataMethodOptions,
} from '../_shared/crud-method/data-method';
import {
  getPrimaryKeyDefinition,
  getPrimaryKeyExpressions,
} from '../_shared/crud-method/primary-key-input';
import { prismaOutputProvider } from '../prisma';
import { prismaCrudServiceProvider } from '../prisma-crud-service';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
  prismaFields: z.array(z.string().min(1)),
  transformerNames: z.array(z.string().min(1)).optional(),
});

function getMethodDefinition(
  serviceMethodExpression: TypescriptCodeExpression,
  options: PrismaDataMethodOptions
): ServiceOutputMethod {
  const { name, modelName, prismaOutput } = options;
  const prismaDefinition = prismaOutput.getPrismaModel(modelName);

  const dataType = getDataMethodDataType(options);
  const idArgument = getPrimaryKeyDefinition(prismaDefinition);
  return {
    name,
    expression: serviceMethodExpression,
    arguments: [
      idArgument,
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

  const model = prismaOutput.getPrismaModel(modelName);
  const primaryKey = getPrimaryKeyExpressions(model);

  return TypescriptCodeUtils.formatExpression(
    `
async METHOD_NAME(ID_ARGUMENT, data: UPDATE_INPUT_TYPE_NAME): Promise<MODEL_TYPE> {
  FUNCTION_BODY

  return PRISMA_MODEL.update(UPDATE_ARGS);
}
`.trim(),
    {
      METHOD_NAME: name,
      UPDATE_INPUT_TYPE_NAME: updateInputTypeName,
      MODEL_TYPE: modelType,
      ID_ARGUMENT: primaryKey.argument,
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
      FUNCTION_BODY: functionBody,
      UPDATE_ARGS: TypescriptCodeUtils.mergeExpressionsAsObject({
        where: primaryKey.whereClause,
        data: dataExpression,
      }),
    },
    {
      headerBlocks: [typeHeaderBlock, primaryKey.headerTypeBlock].filter(
        notEmpty
      ),
    }
  );
}

const PrismaCrudUpdateGenerator = createGeneratorWithChildren({
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
      isUpdate: true,
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
