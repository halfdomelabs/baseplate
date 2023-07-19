import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { serviceContextProvider } from '@src/generators/core/service-context/index.js';
import { serviceFileProvider } from '@src/generators/core/service-file/index.js';
import {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
} from '@src/providers/prisma/prisma-data-transformable.js';
import {
  prismaToServiceOutputDto,
  ServiceOutputMethod,
} from '@src/types/serviceOutput.js';
import {
  getDataInputTypeBlock,
  getDataMethodContextRequired,
  getDataMethodDataExpressions,
  getDataMethodDataType,
  PrismaDataMethodOptions,
  wrapWithApplyDataPipe,
} from '../_shared/crud-method/data-method.js';
import { prismaOutputProvider } from '../prisma/index.js';
import { prismaCrudServiceProvider } from '../prisma-crud-service/index.js';
import { prismaUtilsProvider } from '../prisma-utils/index.js';

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
        type: 'nested',
        name: 'input',
        nestedType: {
          name: 'CreateServiceInput',
          fields: [
            {
              name: 'data',
              type: 'nested',
              nestedType: dataType,
            },
          ],
        },
      },
    ],
    requiresContext: hasContext,
    returnType: prismaToServiceOutputDto(prismaDefinition, (enumName) =>
      prismaOutput.getServiceEnum(enumName)
    ),
  };
}

function getMethodBlock(options: PrismaDataMethodOptions): TypescriptCodeBlock {
  const { name, modelName, prismaOutput, prismaUtils } = options;

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
        '...': 'query',
      }),
    }
  );

  return TypescriptCodeUtils.formatBlock(
    `
export async function METHOD_NAME({ data, query, EXTRA_ARGS }: CreateServiceInput<CREATE_INPUT_TYPE_NAME, QUERY_ARGS>): Promise<MODEL_TYPE> {
  FUNCTION_BODY

  return OPERATION;
}
`.trim(),
    {
      METHOD_NAME: name,
      CREATE_INPUT_TYPE_NAME: createInputTypeName,
      MODEL_TYPE: modelType,
      EXTRA_ARGS: contextRequired ? 'context' : '',
      QUERY_ARGS: `Prisma.${modelName}Args`,
      FUNCTION_BODY: functionBody,
      OPERATION: wrapWithApplyDataPipe(operation, dataPipeNames, prismaUtils),
    },
    {
      headerBlocks: [typeHeaderBlock],
      importText: [
        "import { CreateServiceInput } from '%prisma-utils/crudServiceTypes';",
        "import { Prisma } from '@prisma/client';",
      ],
      importMappers: [prismaUtils],
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

    const methodName = `${name}${modelName}`;

    const serviceMethodExpression = TypescriptCodeUtils.createExpression(
      methodName,
      `import { ${methodName} } from '${serviceFile.getServiceImport()}';`
    );
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
          name: methodName,
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
          getMethodBlock(methodOptions),
          getMethodDefinition(serviceMethodExpression, methodOptions)
        );
      },
    };
  },
});

export default PrismaCrudCreateGenerator;
