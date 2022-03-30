import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { serviceFileProvider } from '@src/generators/core/service-file';
import {
  prismaToServiceOutputDto,
  ServiceOutputMethod,
} from '@src/types/serviceOutput';
import { PrismaOutputProvider, prismaOutputProvider } from '../prisma';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  modelName: yup.string().required(),
});

interface PrismaDeleteMethodOptions {
  descriptor: yup.InferType<typeof descriptorSchema>;
  prismaOutput: PrismaOutputProvider;
  methodExpression: TypescriptCodeExpression;
}

export type PrismaDeleteMethodProvider = unknown;

export const prismaDeleteMethodProvider =
  createProviderType<PrismaDeleteMethodProvider>('prisma-delete-method');

function getMethodDefinition({
  descriptor: { name, modelName },
  prismaOutput,
  methodExpression,
}: PrismaDeleteMethodOptions): ServiceOutputMethod {
  const prismaDefinition = prismaOutput.getPrismaModel(modelName);
  return {
    name,
    expression: methodExpression,
    arguments: [
      {
        name: 'id',
        type: 'scalar',
        scalarType: 'uuid',
      },
    ],
    returnType: prismaToServiceOutputDto(prismaDefinition),
  };
}

function getMethodExpression({
  descriptor: { name, modelName },
  prismaOutput,
}: PrismaDeleteMethodOptions): TypescriptCodeExpression {
  const modelType = TypescriptCodeUtils.createExpression(
    modelName,
    `import {${modelName}} from '@prisma/client'`
  );

  return TypescriptCodeUtils.formatExpression(
    `
async OPERATION_NAME(id: string): Promise<MODEL_TYPE> {
return PRISMA_MODEL.delete({ where: { id } });
}
`.trim(),
    {
      OPERATION_NAME: name,
      MODEL_TYPE: modelType,
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
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
    const { name } = descriptor;
    const methodExpression = serviceFile
      .getServiceExpression()
      .append(`.${name}`);

    const methodOptions = {
      descriptor,
      prismaOutput,
      methodExpression,
    };

    serviceFile.registerMethod(
      name,
      getMethodExpression(methodOptions),
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
