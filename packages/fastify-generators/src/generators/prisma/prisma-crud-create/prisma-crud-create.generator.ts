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

import type { PrismaDataMethodOptions } from '../_shared/crud-method/data-method.js';

import {
  getDataInputTypeBlock,
  getDataMethodContextRequired,
  getDataMethodDataExpressions,
  getDataMethodDataType,
  wrapWithApplyDataPipe,
} from '../_shared/crud-method/data-method.js';
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
  const hasContext = getDataMethodContextRequired(options);

  return {
    name,
    referenceFragment: serviceMethodReference,
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
      prismaOutput.getServiceEnum(enumName),
    ),
  };
}

function getMethodBlock(options: PrismaDataMethodOptions): TsCodeFragment {
  const { name, modelName, prismaOutput, prismaUtils } = options;

  const createInputTypeName = `${modelName}CreateData`;

  const typeHeaderBlock = getDataInputTypeBlock(createInputTypeName, options);

  const { functionBody, createExpression, dataPipeNames } =
    getDataMethodDataExpressions(options);

  const contextRequired = getDataMethodContextRequired(options);

  const modelType = prismaOutput.getModelTypeFragment(modelName);

  const operation = TsCodeUtils.formatFragment(
    `PRISMA_MODEL.create(CREATE_ARGS)`,
    {
      PRISMA_MODEL: prismaOutput.getPrismaModelFragment(modelName),
      CREATE_ARGS: TsCodeUtils.mergeFragmentsAsObjectPresorted({
        data: createExpression,
        '...': 'query',
      }),
    },
  );

  return TsCodeUtils.formatFragment(
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
      QUERY_ARGS: `Prisma.${modelName}DefaultArgs`,
      FUNCTION_BODY: functionBody,
      OPERATION: wrapWithApplyDataPipe(operation, dataPipeNames, prismaUtils),
    },
    [
      tsImportBuilder(['Prisma']).from('@prisma/client'),
      prismaUtils.CreateServiceInput.typeDeclaration(),
    ],
    { hoistedFragments: [typeHeaderBlock] },
  );
}

export const prismaCrudCreateGenerator = createGenerator({
  name: 'prisma/prisma-crud-create',
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
          operationType: 'create',
        };
        const transformers: PrismaDataTransformer[] =
          transformerNames?.map((transformerName) =>
            crudPrismaService
              .getTransformerByName(transformerName)
              .buildTransformer(transformerOption),
          ) ?? [];

        return {
          build: () => {
            const methodOptions: PrismaDataMethodOptions = {
              name: methodName,
              modelName,
              prismaFieldNames: prismaFields,
              prismaOutput,
              operationName: 'create',
              isPartial: false,
              transformers,
              serviceContextImports,
              prismaUtils: prismaUtilsImports,
              operationType: 'create',
              whereUniqueExpression: null,
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
