import type {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';

import type {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
} from '@src/providers/prisma/prisma-data-transformable.js';
import type { ServiceOutputMethod } from '@src/types/service-output.js';

import { serviceContextProvider } from '@src/generators/core/service-context/index.js';
import { serviceFileProvider } from '@src/generators/core/service-file/index.js';
import { prismaToServiceOutputDto } from '@src/types/service-output.js';
import { notEmpty } from '@src/utils/array.js';

import type { PrismaDataMethodOptions } from '../_shared/crud-method/data-method.js';

import {
  getDataInputTypeBlock,
  getDataMethodContextRequired,
  getDataMethodDataExpressions,
  getDataMethodDataType,
  wrapWithApplyDataPipe,
} from '../_shared/crud-method/data-method.js';
import {
  getPrimaryKeyDefinition,
  getPrimaryKeyExpressions,
} from '../_shared/crud-method/primary-key-input.js';
import { prismaCrudServiceProvider } from '../prisma-crud-service/index.js';
import { prismaUtilsProvider } from '../prisma-utils/index.js';
import { prismaOutputProvider } from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
  prismaFields: z.array(z.string().min(1)),
  transformerNames: z.array(z.string().min(1)).optional(),
});

function getMethodDefinition(
  serviceMethodExpression: TypescriptCodeExpression,
  options: PrismaDataMethodOptions,
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
      {
        type: 'nested',
        name: 'input',
        nestedType: {
          name: 'UpdateServiceInput',
          fields: [
            idArgument,
            {
              name: 'data',
              type: 'nested',
              nestedType: dataType,
            },
          ],
        },
      },
    ],
    requiresContext: contextRequired,
    returnType: prismaToServiceOutputDto(prismaDefinition, (enumName) =>
      prismaOutput.getServiceEnum(enumName),
    ),
  };
}

function getMethodBlock(options: PrismaDataMethodOptions): TypescriptCodeBlock {
  const { name, modelName, prismaOutput, prismaUtils } = options;

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
        '...': 'query',
      }),
    },
  );

  return TypescriptCodeUtils.formatBlock(
    `
export async function METHOD_NAME({ ID_ARG, data, query, EXTRA_ARGS }: UpdateServiceInput<PRIMARY_KEY_TYPE, UPDATE_INPUT_TYPE_NAME, QUERY_ARGS>): Promise<MODEL_TYPE> {
  FUNCTION_BODY

  return OPERATION;
}
`.trim(),
    {
      METHOD_NAME: name,
      UPDATE_INPUT_TYPE_NAME: updateInputTypeName,
      MODEL_TYPE: modelType,
      ID_ARG:
        primaryKey.argumentName === 'id'
          ? 'id'
          : `id : ${primaryKey.argumentName}`,
      PRIMARY_KEY_TYPE: primaryKey.argumentType,
      QUERY_ARGS: `Prisma.${modelName}DefaultArgs`,
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
      FUNCTION_BODY: functionBody,
      OPERATION: wrapWithApplyDataPipe(operation, dataPipeNames, prismaUtils),
      EXTRA_ARGS: contextRequired ? 'context' : '',
    },
    {
      headerBlocks: [typeHeaderBlock, primaryKey.headerTypeBlock].filter(
        notEmpty,
      ),
      importText: [
        "import { UpdateServiceInput } from '%prisma-utils/crudServiceTypes';",
        "import { Prisma } from '@prisma/client';",
      ],
      importMappers: [prismaUtils],
    },
  );
}

const PrismaCrudUpdateGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    serviceFile: serviceFileProvider.dependency(),
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
    },
  ) {
    const { name, modelName, prismaFields, transformerNames } = descriptor;
    const methodName = `${name}${modelName}`;

    const serviceMethodExpression = TypescriptCodeUtils.createExpression(
      methodName,
      `import { ${methodName} } from '${serviceFile.getServiceImport()}';`,
    );
    const transformerOption: PrismaDataTransformerOptions = {
      operationType: 'update',
    };
    const transformers: PrismaDataTransformer[] =
      transformerNames?.map((transformerName) =>
        crudPrismaService
          .getTransformerByName(transformerName)
          .buildTransformer(transformerOption),
      ) ?? [];

    return {
      getProviders: () => ({}),
      build: () => {
        const model = prismaOutput.getPrismaModel(modelName);
        const primaryKey = getPrimaryKeyExpressions(model);
        const methodOptions: PrismaDataMethodOptions = {
          name: methodName,
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
          getMethodBlock(methodOptions),
          getMethodDefinition(serviceMethodExpression, methodOptions),
        );
      },
    };
  },
});

export default PrismaCrudUpdateGenerator;
