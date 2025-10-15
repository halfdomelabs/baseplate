import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { NUMBER_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import type {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
} from '#src/providers/prisma/prisma-data-transformable.js';
import type { ServiceOutputMethod } from '#src/types/service-output.js';

import { serviceContextImportsProvider } from '#src/generators/core/service-context/index.js';
import { serviceFileProvider } from '#src/generators/core/service-file/index.js';
import { prismaToServiceOutputDto } from '#src/types/service-output.js';

import type { PrismaDataMethodOptions } from '../_shared/crud-method/data-method.js';

import { prismaGeneratedImportsProvider } from '../_providers/prisma-generated-imports.js';
import {
  getDataInputTypeBlock,
  getDataMethodContextRequired,
  getDataMethodDataExpressions,
  getDataMethodDataType,
  wrapWithApplyDataPipe,
} from '../_shared/crud-method/data-method.js';
import { prismaCrudServiceProvider } from '../prisma-crud-service/index.js';
import { prismaUtilsImportsProvider } from '../prisma-utils/index.js';
import { prismaOutputProvider } from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  order: NUMBER_VALIDATORS.POSITIVE_INT,
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
  const { name, modelName, prismaOutput, prismaUtils, prismaGeneratedImports } =
    options;

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
      prismaGeneratedImports.Prisma.typeDeclaration(),
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
        prismaGeneratedImports: prismaGeneratedImportsProvider,
      },
      run({
        prismaOutput,
        serviceFile,
        crudPrismaService,
        serviceContextImports,
        prismaUtilsImports,
        prismaGeneratedImports,
      }) {
        const { name, modelName, prismaFields, transformerNames } = descriptor;

        const methodName = `${name}${modelName}`;

        const serviceMethodReference = TsCodeUtils.importFragment(
          methodName,
          serviceFile.getServicePath(),
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
              prismaGeneratedImports,
              operationType: 'create',
              whereUniqueExpression: null,
            };

            serviceFile.registerMethod({
              order: descriptor.order,
              name,
              fragment: getMethodBlock(methodOptions),
              outputMethod: getMethodDefinition(
                serviceMethodReference,
                methodOptions,
              ),
            });
          },
        };
      },
    }),
  }),
});
