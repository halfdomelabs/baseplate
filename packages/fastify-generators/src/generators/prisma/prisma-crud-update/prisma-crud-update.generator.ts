import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import { TsCodeUtils, tsImportBuilder } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import type {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
} from '@src/providers/prisma/prisma-data-transformable.js';
import type { ServiceOutputMethod } from '@src/types/service-output.js';

import { serviceContextImportsProvider } from '@src/generators/core/service-context/service-context.generator.js';
import { serviceFileProvider } from '@src/generators/core/service-file/service-file.generator.js';
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
import { prismaCrudServiceProvider } from '../prisma-crud-service/prisma-crud-service.generator.js';
import { prismaUtilsImportsProvider } from '../prisma-utils/prisma-utils.generator.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
  prismaFields: z.array(z.string().min(1)),
  transformerNames: z.array(z.string().min(1)).optional(),
});

function getMethodDefinition(
  serviceMethodReference: TsCodeFragment,
  options: PrismaDataMethodOptions,
): ServiceOutputMethod {
  const { name, modelName, prismaOutput } = options;
  const prismaDefinition = prismaOutput.getPrismaModel(modelName);

  const dataType = getDataMethodDataType(options);
  const idArgument = getPrimaryKeyDefinition(prismaDefinition);
  const contextRequired = getDataMethodContextRequired(options);

  return {
    name,
    referenceFragment: serviceMethodReference,
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

function getMethodBlock(options: PrismaDataMethodOptions): TsCodeFragment {
  const { name, modelName, prismaOutput, prismaUtils } = options;

  const updateInputTypeName = `${modelName}UpdateData`;

  const typeHeaderBlock = getDataInputTypeBlock(updateInputTypeName, options);

  const { functionBody, updateExpression, dataPipeNames } =
    getDataMethodDataExpressions(options);

  const contextRequired = getDataMethodContextRequired(options);

  const modelType = prismaOutput.getModelTypeFragment(modelName);

  const model = prismaOutput.getPrismaModel(modelName);
  const primaryKey = getPrimaryKeyExpressions(model);

  const operation = TsCodeUtils.formatFragment(
    `PRISMA_MODEL.update(UPDATE_ARGS)`,
    {
      PRISMA_MODEL: prismaOutput.getPrismaModelFragment(modelName),
      UPDATE_ARGS: TsCodeUtils.mergeFragmentsAsObjectPresorted({
        where: primaryKey.whereClause,
        data: updateExpression,
        '...': 'query',
      }),
    },
  );

  return TsCodeUtils.formatFragment(
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
      PRISMA_MODEL: prismaOutput.getPrismaModelFragment(modelName),
      FUNCTION_BODY: functionBody,
      OPERATION: wrapWithApplyDataPipe(operation, dataPipeNames, prismaUtils),
      EXTRA_ARGS: contextRequired ? 'context' : '',
    },
    [
      prismaUtils.UpdateServiceInput.typeDeclaration(),
      tsImportBuilder(['Prisma']).from('@prisma/client'),
    ],
    {
      hoistedFragments: [typeHeaderBlock, primaryKey.headerTypeBlock].filter(
        notEmpty,
      ),
    },
  );
}

export const prismaCrudUpdateGenerator = createGenerator({
  name: 'prisma/prisma-crud-update',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        serviceFile: serviceFileProvider.dependency(),
        crudPrismaService: prismaCrudServiceProvider,
        serviceContextImports: serviceContextImportsProvider,
        prismaUtilsImports: prismaUtilsImportsProvider,
      },
      run({
        prismaOutput,
        serviceFile,
        crudPrismaService,
        serviceContextImports,
        prismaUtilsImports,
      }) {
        const { name, modelName, prismaFields, transformerNames } = descriptor;
        const methodName = `${name}${modelName}`;

        const serviceMethodReference = TsCodeUtils.importFragment(
          methodName,
          serviceFile.getServiceImport(),
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
              serviceContextImports,
              prismaUtils: prismaUtilsImports,
              operationType: 'update',
              whereUniqueExpression: primaryKey.whereClause,
            };

            serviceFile.registerMethod(
              name,
              getMethodBlock(methodOptions),
              getMethodDefinition(serviceMethodReference, methodOptions),
            );
          },
        };
      },
    }),
  }),
});
