import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
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
import {
  getDataInputTypeBlock,
  getDataMethodDataExpressions,
  getDataMethodDataType,
  PrismaDataMethodOptions,
  getDataMethodContextRequired,
  wrapWithApplyDataPipe,
} from '../_shared/crud-method/data-method';
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
  const hasContext = getDataMethodContextRequired(options);

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
    requiresContext: hasContext,
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

  const createInputTypeName = `${modelName}CreateData`;

  const typeHeaderBlock = getDataInputTypeBlock(createInputTypeName, options);

  const { functionBody, createExpression, dataPipeNames } =
    getDataMethodDataExpressions(options);

  const contextRequired = getDataMethodContextRequired(options);

  const modelType = prismaOutput.getModelTypeExpression(modelName);

  const operation = TypescriptCodeUtils.formatExpression(
    `PRISMA_MODEL.create(CREATE_ARGS)`,
    {
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
      CREATE_ARGS: TypescriptCodeUtils.mergeExpressionsAsObject({
        data: createExpression,
      }),
    }
  );

  return TypescriptCodeUtils.formatExpression(
    `
async METHOD_NAME(data: CREATE_INPUT_TYPE_NAME, CONTEXT): Promise<MODEL_TYPE> {
  FUNCTION_BODY

  return OPERATION;
}
`.trim(),
    {
      METHOD_NAME: name,
      CREATE_INPUT_TYPE_NAME: createInputTypeName,
      MODEL_TYPE: modelType,
      CONTEXT: contextRequired
        ? serviceContext.getServiceContextType().prepend(`context: `)
        : '',
      FUNCTION_BODY: functionBody,
      OPERATION: wrapWithApplyDataPipe(operation, dataPipeNames, prismaUtils),
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
      operationType: 'create',
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
          serviceContext,
          prismaUtils,
          operationType: 'create',
          whereUniqueExpression: null,
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
