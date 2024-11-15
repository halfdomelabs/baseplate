import type {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import type { ServiceOutputMethod } from '@src/types/service-output.js';

import { serviceFileProvider } from '@src/generators/core/service-file/index.js';
import { prismaToServiceOutputDto } from '@src/types/service-output.js';

import type { PrismaUtilsProvider } from '../prisma-utils/index.js';
import type { PrismaOutputProvider } from '../prisma/index.js';

import {
  getPrimaryKeyDefinition,
  getPrimaryKeyExpressions,
} from '../_shared/crud-method/primary-key-input.js';
import { prismaUtilsProvider } from '../prisma-utils/index.js';
import { prismaOutputProvider } from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
});

interface PrismaDeleteMethodOptions {
  methodName: string;
  descriptor: z.infer<typeof descriptorSchema>;
  prismaOutput: PrismaOutputProvider;
  methodExpression: TypescriptCodeExpression;
  prismaUtils: PrismaUtilsProvider;
}

export type PrismaDeleteMethodProvider = unknown;

export const prismaDeleteMethodProvider =
  createProviderType<PrismaDeleteMethodProvider>('prisma-delete-method');

function getMethodDefinition({
  methodName,
  descriptor: { modelName },
  prismaOutput,
  methodExpression,
}: PrismaDeleteMethodOptions): ServiceOutputMethod {
  const prismaDefinition = prismaOutput.getPrismaModel(modelName);
  const idArgument = getPrimaryKeyDefinition(prismaDefinition);
  return {
    name: methodName,
    expression: methodExpression,
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
}: PrismaDeleteMethodOptions): TypescriptCodeBlock {
  const modelType = TypescriptCodeUtils.createExpression(
    modelName,
    `import {${modelName}} from '@prisma/client'`,
  );

  const model = prismaOutput.getPrismaModel(modelName);
  const primaryKey = getPrimaryKeyExpressions(model);

  return TypescriptCodeUtils.formatBlock(
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
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
    },
    {
      headerBlocks: primaryKey.headerTypeBlock && [primaryKey.headerTypeBlock],
      importText: [
        "import { DeleteServiceInput } from '%prisma-utils/crudServiceTypes';",
        "import { Prisma } from '@prisma/client';",
      ],
      importMappers: [prismaUtils],
    },
  );
}

const PrismaCrudDeleteGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    serviceFile: serviceFileProvider,
    prismaUtils: prismaUtilsProvider,
  },
  exports: {
    prismaDeleteMethod: prismaDeleteMethodProvider,
  },
  createGenerator(descriptor, { prismaOutput, serviceFile, prismaUtils }) {
    const { name, modelName } = descriptor;

    const methodName = `${name}${modelName}`;

    const methodExpression = TypescriptCodeUtils.createExpression(
      methodName,
      `import { ${methodName} } from '${serviceFile.getServiceImport()}';`,
    );

    const methodOptions = {
      methodName,
      descriptor,
      prismaOutput,
      methodExpression,
      prismaUtils,
    };

    serviceFile.registerMethod(
      name,
      getMethodBlock(methodOptions),
      getMethodDefinition(methodOptions),
    );

    return {
      getProviders: () => ({
        prismaDeleteMethod: {},
      }),
    };
  },
});

export default PrismaCrudDeleteGenerator;
