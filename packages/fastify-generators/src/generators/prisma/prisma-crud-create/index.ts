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
  ServiceOutputDto,
  ServiceOutputMethod,
} from '@src/types/serviceOutput';
import { PrismaOutputProvider, prismaOutputProvider } from '../prisma';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  modelName: yup.string().required(),
  prismaFields: yup.array(yup.string().required()).required(),
});

interface PrismaCreateMethodOptions {
  descriptor: yup.InferType<typeof descriptorSchema>;
  prismaOutput: PrismaOutputProvider;
  methodExpression: TypescriptCodeExpression;
}

export type PrismaCreateMethodProvider = unknown;

export const prismaCreateMethodProvider =
  createProviderType<PrismaCreateMethodProvider>('prisma-create-method');

function getMethodDefinition({
  descriptor: { name, modelName, prismaFields: prismaFieldNames },
  prismaOutput,
  methodExpression,
}: PrismaCreateMethodOptions): ServiceOutputMethod {
  const prismaDefinition = prismaOutput.getPrismaModel(modelName);
  const prismaFields = prismaFieldNames.map((fieldName) => {
    const field = prismaDefinition.fields.find((f) => f.name === fieldName);
    if (!field) {
      throw new Error(
        `Could not find field ${fieldName} in model ${modelName}`
      );
    }
    return field;
  });
  const dataType: ServiceOutputDto = {
    name: `${modelName}CreateData`,
    fields: prismaFields.map((field) => {
      if (field.type !== 'scalar') {
        throw new Error(`Non-scalar fields not suppported in create`);
      }
      return {
        type: 'scalar',
        name: field.name,
        isOptional: field.isOptional || field.hasDefault,
        isList: field.isList,
        scalarType: field.scalarType,
      };
    }),
  };
  return {
    name,
    expression: methodExpression,
    arguments: [
      {
        name: 'data',
        type: 'nested',
        nestedType: dataType,
      },
    ],
    returnType: prismaToServiceOutputDto(prismaDefinition),
  };
}

function getMethodExpression({
  descriptor: { name, modelName, prismaFields },
  prismaOutput,
}: PrismaCreateMethodOptions): TypescriptCodeExpression {
  const fields = prismaFields.map((field) => `'${field}'`).join(' | ');

  const createInputTypeName = `${modelName}CreateData`;

  const typeHeaderBlock = TypescriptCodeUtils.formatBlock(
    `type CREATE_INPUT_TYPE_NAME = Pick<Prisma.PRISMA_CREATE_INPUT, FIELDS>;`,
    {
      CREATE_INPUT_TYPE_NAME: createInputTypeName,
      PRISMA_CREATE_INPUT: `${modelName}UncheckedCreateInput`,
      FIELDS: fields,
    },
    { importText: [`import {Prisma} from '@prisma/client'`] }
  );

  const modelType = TypescriptCodeUtils.createExpression(
    modelName,
    `import {${modelName}} from '@prisma/client'`
  );

  return TypescriptCodeUtils.formatExpression(
    `
async OPERATION_NAME(data: CREATE_INPUT_TYPE_NAME): Promise<MODEL_TYPE> {
return PRISMA_MODEL.create({ data });
}
`.trim(),
    {
      OPERATION_NAME: name,
      CREATE_INPUT_TYPE_NAME: createInputTypeName,
      MODEL_TYPE: modelType,
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
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
    serviceFile: serviceFileProvider,
  },
  exports: {
    prismaCreateMethod: prismaCreateMethodProvider,
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
        prismaCreateMethod: {},
      }),
      build: async () => {},
    };
  },
});

export default PrismaCrudCreateGenerator;
