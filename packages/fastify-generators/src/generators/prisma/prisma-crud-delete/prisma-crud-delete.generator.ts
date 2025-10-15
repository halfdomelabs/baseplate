import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { NUMBER_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import type { ServiceOutputMethod } from '#src/types/service-output.js';

import { serviceFileProvider } from '#src/generators/core/service-file/index.js';
import { prismaToServiceOutputDto } from '#src/types/service-output.js';

import type { PrismaGeneratedImportsProvider } from '../_providers/prisma-generated-imports.js';
import type { PrismaUtilsImportsProvider } from '../prisma-utils/index.js';
import type { PrismaOutputProvider } from '../prisma/index.js';

import { prismaGeneratedImportsProvider } from '../_providers/prisma-generated-imports.js';
import {
  getPrimaryKeyDefinition,
  getPrimaryKeyExpressions,
} from '../_shared/crud-method/primary-key-input.js';
import { prismaUtilsImportsProvider } from '../prisma-utils/index.js';
import { prismaOutputProvider } from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  order: NUMBER_VALIDATORS.POSITIVE_INT,
  modelName: z.string().min(1),
});

interface PrismaDeleteMethodOptions {
  methodName: string;
  descriptor: z.infer<typeof descriptorSchema>;
  prismaOutput: PrismaOutputProvider;
  serviceMethodReference: TsCodeFragment;
  prismaUtils: PrismaUtilsImportsProvider;
  prismaGeneratedImports: PrismaGeneratedImportsProvider;
}

function getMethodDefinition({
  methodName,
  descriptor: { modelName },
  prismaOutput,
  serviceMethodReference,
}: PrismaDeleteMethodOptions): ServiceOutputMethod {
  const prismaDefinition = prismaOutput.getPrismaModel(modelName);
  const idArgument = getPrimaryKeyDefinition(prismaDefinition);
  return {
    name: methodName,
    referenceFragment: serviceMethodReference,
    arguments: [
      {
        type: 'nested',
        name: 'input',
        nestedType: {
          name: 'DeleteServiceInput',
          fields: [idArgument],
        },
      },
    ],
    returnType: prismaToServiceOutputDto(prismaDefinition, (enumName) =>
      prismaOutput.getServiceEnum(enumName),
    ),
  };
}

function getMethodBlock({
  methodName,
  descriptor: { modelName },
  prismaOutput,
  prismaUtils,
  prismaGeneratedImports,
}: PrismaDeleteMethodOptions): TsCodeFragment {
  const modelType = prismaOutput.getModelTypeFragment(modelName);

  const model = prismaOutput.getPrismaModel(modelName);
  const primaryKey = getPrimaryKeyExpressions(model);

  return TsCodeUtils.formatFragment(
    `
export async function OPERATION_NAME({ ID_ARG, query }: DeleteServiceInput<PRIMARY_KEY_TYPE, QUERY_ARGS>): Promise<MODEL_TYPE> {
return PRISMA_MODEL.delete({ where: WHERE_CLAUSE, ...query });
}
`.trim(),
    {
      OPERATION_NAME: methodName,
      MODEL_TYPE: modelType,
      ID_ARG:
        primaryKey.argumentName === 'id'
          ? 'id'
          : `id : ${primaryKey.argumentName}`,
      PRIMARY_KEY_TYPE: primaryKey.argumentType,
      QUERY_ARGS: `Prisma.${modelName}DefaultArgs`,
      WHERE_CLAUSE: primaryKey.whereClause,
      PRISMA_MODEL: prismaOutput.getPrismaModelFragment(modelName),
    },
    [
      prismaUtils.DeleteServiceInput.typeDeclaration(),
      prismaGeneratedImports.Prisma.typeDeclaration(),
    ],
    {
      hoistedFragments: primaryKey.headerTypeBlock && [
        primaryKey.headerTypeBlock,
      ],
    },
  );
}

export const prismaCrudDeleteGenerator = createGenerator({
  name: 'prisma/prisma-crud-delete',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        serviceFile: serviceFileProvider,
        prismaUtilsImports: prismaUtilsImportsProvider,
        prismaGeneratedImports: prismaGeneratedImportsProvider,
      },
      run({
        prismaOutput,
        serviceFile,
        prismaUtilsImports,
        prismaGeneratedImports,
      }) {
        const { name, modelName } = descriptor;

        const methodName = `${name}${modelName}`;

        const serviceMethodReference = TsCodeUtils.importFragment(
          methodName,
          serviceFile.getServicePath(),
        );

        const methodOptions = {
          methodName,
          descriptor,
          prismaOutput,
          serviceMethodReference,
          prismaUtils: prismaUtilsImports,
          prismaGeneratedImports,
        };

        serviceFile.registerMethod({
          order: descriptor.order,
          name,
          fragment: getMethodBlock(methodOptions),
          outputMethod: getMethodDefinition(methodOptions),
        });

        return {};
      },
    }),
  }),
});
