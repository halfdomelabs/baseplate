import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { serviceFileProvider } from '@src/generators/core/service-file';
import {
  prismaToServiceOutputDto,
  ServiceOutputMethod,
} from '@src/types/serviceOutput';
import {
  getPrimaryKeyDefinition,
  getPrimaryKeyExpressions,
} from '../_shared/crud-method/primary-key-input';
import { PrismaOutputProvider, prismaOutputProvider } from '../prisma';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
});

interface PrismaDeleteMethodOptions {
  methodName: string;
  descriptor: z.infer<typeof descriptorSchema>;
  prismaOutput: PrismaOutputProvider;
  methodExpression: TypescriptCodeExpression;
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
    arguments: [idArgument],
    returnType: prismaToServiceOutputDto(prismaDefinition, (enumName) =>
      prismaOutput.getServiceEnum(enumName)
    ),
  };
}

function getMethodBlock({
  methodName,
  descriptor: { modelName },
  prismaOutput,
}: PrismaDeleteMethodOptions): TypescriptCodeBlock {
  const modelType = TypescriptCodeUtils.createExpression(
    modelName,
    `import {${modelName}} from '@prisma/client'`
  );

  const model = prismaOutput.getPrismaModel(modelName);
  const primaryKey = getPrimaryKeyExpressions(model);

  return TypescriptCodeUtils.formatBlock(
    `
export async function OPERATION_NAME(ID_ARGUMENT): Promise<MODEL_TYPE> {
return PRISMA_MODEL.delete({ where: WHERE_CLAUSE });
}
`.trim(),
    {
      OPERATION_NAME: methodName,
      MODEL_TYPE: modelType,
      ID_ARGUMENT: primaryKey.argument,
      WHERE_CLAUSE: primaryKey.whereClause,
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
    },
    {
      headerBlocks: primaryKey.headerTypeBlock && [primaryKey.headerTypeBlock],
    }
  );
}

const PrismaCrudDeleteGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    serviceFile: serviceFileProvider,
  },
  exports: {
    prismaDeleteMethod: prismaDeleteMethodProvider,
  },
  createGenerator(descriptor, { prismaOutput, serviceFile }) {
    const { name, modelName } = descriptor;

    const methodName = `${name}${modelName}`;

    const methodExpression = TypescriptCodeUtils.createExpression(
      methodName,
      `import { ${methodName} } from '${serviceFile.getServiceImport()}';`
    );

    const methodOptions = {
      methodName,
      descriptor,
      prismaOutput,
      methodExpression,
    };

    serviceFile.registerMethod(
      name,
      getMethodBlock(methodOptions),
      getMethodDefinition(methodOptions)
    );

    return {
      getProviders: () => ({
        prismaDeleteMethod: {},
      }),
      build: async () => {},
    };
  },
});

export default PrismaCrudDeleteGenerator;
