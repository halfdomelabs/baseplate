import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { serviceContextProvider } from '@src/generators/core/service-context';
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
  getDataMethodContextRequired,
  getDataMethodDataExpressions,
  getDataMethodDataType,
  PrismaDataMethodOptions,
  wrapWithApplyDataPipe,
} from '../_shared/crud-method/data-method';
import {
  getPrimaryKeyDefinition,
  getPrimaryKeyExpressions,
} from '../_shared/crud-method/primary-key-input';
import { prismaOutputProvider } from '../prisma';
import { prismaCrudServiceProvider } from '../prisma-crud-service';
import { prismaUtilsProvider } from '../prisma-utils';

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
  const contextRequired = getDataMethodContextRequired(options);

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
    requiresContext: contextRequired,
    returnType: prismaToServiceOutputDto(prismaDefinition, (enumName) =>
      prismaOutput.getServiceEnum(enumName)
    ),
  };
}

function getMethodExpression(
  options: PrismaDataMethodOptions
): TypescriptCodeExpression {
  const { name, modelName, prismaOutput, serviceContext, prismaUtils } =
    options;

  const updateInputTypeName = `${modelName}UpdateData`;

  const typeHeaderBlock = getDataInputTypeBlock(updateInputTypeName, options);

  const { functionBody, updateExpression, dataPipeNames } =
    getDataMethodDataExpressions(options);

  const contextRequired = getDataMethodContextRequired(options);

  const modelType = prismaOutput.getModelTypeExpression(modelName);

  const model = prismaOutput.getPrismaModel(modelName);
  const primaryKey = getPrimaryKeyExpressions(model);

  const operation = TypescriptCodeUtils.formatExpression(
    `PRISMA_MODEL.update(UPDATE_ARGS)`,
    {
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
      UPDATE_ARGS: TypescriptCodeUtils.mergeExpressionsAsObject({
        where: primaryKey.whereClause,
        data: updateExpression,
      }),
    }
  );

  return TypescriptCodeUtils.formatExpression(
    `
async METHOD_NAME(ID_ARGUMENT, data: UPDATE_INPUT_TYPE_NAME, CONTEXT): Promise<MODEL_TYPE> {
  FUNCTION_BODY

  return OPERATION;
}
`.trim(),
    {
      METHOD_NAME: name,
      UPDATE_INPUT_TYPE_NAME: updateInputTypeName,
      MODEL_TYPE: modelType,
      ID_ARGUMENT: primaryKey.argument,
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
      FUNCTION_BODY: functionBody,
      OPERATION: wrapWithApplyDataPipe(operation, dataPipeNames, prismaUtils),
      CONTEXT: contextRequired
        ? serviceContext.getServiceContextType().prepend(`context: `)
        : '',
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
    serviceContext: serviceContextProvider,
    prismaUtils: prismaUtilsProvider,
  },
  createGenerator(
    descriptor,
    {
      prismaOutput,
      serviceFile,
      crudPrismaService,
      serviceContext,
      prismaUtils,
    }
  ) {
    const { name, modelName, prismaFields, transformerNames } = descriptor;
    const serviceMethodExpression = serviceFile
      .getServiceExpression()
      .append(`.${name}`);
    const transformerOption: PrismaDataTransformerOptions = {
      operationType: 'update',
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
        const model = prismaOutput.getPrismaModel(modelName);
        const primaryKey = getPrimaryKeyExpressions(model);
        const methodOptions: PrismaDataMethodOptions = {
          name,
          modelName,
          prismaFieldNames: prismaFields,
          prismaOutput,
          operationName: 'update',
          isPartial: true,
          transformers,
          serviceContext,
          prismaUtils,
          operationType: 'update',
          whereUniqueExpression: primaryKey.whereClause,
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
