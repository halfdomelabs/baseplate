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

interface PrismaUpdateMethodOptions {
  descriptor: yup.InferType<typeof descriptorSchema>;
  prismaOutput: PrismaOutputProvider;
  methodExpression: TypescriptCodeExpression;
}

export type PrismaUpdateMethodProvider = unknown;

export const prismaUpdateMethodProvider =
  createProviderType<PrismaUpdateMethodProvider>('prisma-update-method');

function getMethodDefinition({
  descriptor: { name, modelName, prismaFields: prismaFieldNames },
  prismaOutput,
  methodExpression,
}: PrismaUpdateMethodOptions): ServiceOutputMethod {
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
    name: `${modelName}UpdateData`,
    fields: prismaFields.map((field) => {
      if (field.type !== 'scalar') {
        throw new Error(`Non-scalar fields not suppported in create`);
      }
      return {
        type: 'scalar',
        name: field.name,
        isOptional: true,
        isNullable: field.isOptional,
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
        name: 'id',
        type: 'scalar',
        scalarType: 'uuid',
      },
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
}: PrismaUpdateMethodOptions): TypescriptCodeExpression {
  const fields = prismaFields.map((field) => `'${field}'`).join(' | ');

  const updateInputTypeName = `${modelName}UpdateData`;

  const typeHeaderBlock = TypescriptCodeUtils.formatBlock(
    `type UPDATE_INPUT_TYPE_NAME = Pick<Prisma.PRISMA_UPDATE_INPUT, FIELDS>;`,
    {
      UPDATE_INPUT_TYPE_NAME: updateInputTypeName,
      PRISMA_UPDATE_INPUT: `${modelName}UncheckedUpdateInput`,
      FIELDS: fields,
    },
    { importText: [`import {Prisma} from '@prisma/client'`] }
  );

  const modelType = new TypescriptCodeExpression(
    modelName,
    `import {${modelName}} from '@prisma/client'`
  );

  return TypescriptCodeUtils.formatExpression(
    `
async OPERATION_NAME(id: string, data: UPDATE_INPUT_TYPE_NAME): Promise<MODEL_TYPE> {
return PRISMA_MODEL.update({ where: { id }, data });
}
`.trim(),
    {
      OPERATION_NAME: name,
      UPDATE_INPUT_TYPE_NAME: updateInputTypeName,
      MODEL_TYPE: modelType,
      PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
    },
    {
      headerBlocks: [typeHeaderBlock],
    }
  );
}

const PrismaCrudUpdateGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    serviceFile: serviceFileProvider,
  },
  exports: {
    prismaUpdateMethod: prismaUpdateMethodProvider,
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
        prismaUpdateMethod: {},
      }),
      build: async () => {},
    };
  },
});

export default PrismaCrudUpdateGenerator;
