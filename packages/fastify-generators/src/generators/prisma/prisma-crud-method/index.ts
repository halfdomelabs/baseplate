import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { PrismaOutputProvider, prismaOutputProvider } from '../prisma';
import { prismaCrudServiceProvider } from '../prisma-crud-service';

const CRUD_FUNCTION_TYPES = ['create'] as const;
type CrudFunctionType = typeof CRUD_FUNCTION_TYPES[number];

interface PrismaCrudMethodOptions<
  Schema extends Record<string, yup.AnySchema>
> {
  name: string;
  modelName: string;
  prismaOutput: PrismaOutputProvider;
  options: {
    [Key in keyof Schema]: yup.InferType<Schema[Key]>;
  };
}

interface PrismaCrudMethodConfig<
  Schema extends Record<string, yup.AnySchema> = Record<string, yup.AnySchema>
> {
  name: CrudFunctionType;
  optionsSchema?: Schema;
  getMethodExpression: (
    options: PrismaCrudMethodOptions<Schema>
  ) => TypescriptCodeExpression;
}

function createConfig<Schema extends Record<string, yup.AnySchema>>(
  config: PrismaCrudMethodConfig<Schema>
): PrismaCrudMethodConfig<Schema> {
  return config;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const methodConfig: Record<CrudFunctionType, PrismaCrudMethodConfig<any>> = {
  create: createConfig({
    name: 'create',
    optionsSchema: {
      prismaFields: yup.array(yup.string().required()).required(),
    },
    getMethodExpression: ({ name, modelName, prismaOutput, options }) => {
      const fields = options.prismaFields
        .map((field) => `'${field}'`)
        .join(' | ');

      const createInputTypeName = `${modelName}CreateInput`;

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
          PRISMA_MODEL: prismaOutput.getPrismaModel(modelName),
        },
        {
          headerBlocks: [typeHeaderBlock],
        }
      );
    },
  }),
};

const descriptorSchema = yup.object({
  name: yup.string().required(),
  // https://github.com/jquense/yup/issues/1298
  type: yup
    .mixed<CrudFunctionType>()
    .oneOf([...CRUD_FUNCTION_TYPES])
    .required(),
  modelName: yup.string().required(),
  options: yup
    .object()
    .when('type', ([type]: [CrudFunctionType], schema: yup.AnyObjectSchema) =>
      schema.shape(methodConfig[type]?.optionsSchema || {})
    ),
});

const PrismaCrudMethodGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    prismaCrudService: prismaCrudServiceProvider,
  },
  createGenerator(
    { name, type, modelName, options },
    { prismaOutput, prismaCrudService }
  ) {
    const methodMap = prismaCrudService.getMethodMap();

    methodMap.set(
      name,
      methodConfig[type].getMethodExpression({
        name,
        modelName,
        prismaOutput,
        options,
      })
    );

    return {
      build: async (builder) => {},
    };
  },
});

export default PrismaCrudMethodGenerator;
