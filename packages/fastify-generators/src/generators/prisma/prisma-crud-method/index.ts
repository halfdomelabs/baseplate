import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import {
  prismaToServiceOutputDto,
  ServiceOutputDto,
  ServiceOutputMethod,
} from '@src/types/serviceOutput';
import { PrismaOutputProvider, prismaOutputProvider } from '../prisma';
import { prismaCrudServiceProvider } from '../prisma-crud-service';

const CRUD_FUNCTION_TYPES = ['create', 'update', 'delete'] as const;
type CrudFunctionType = typeof CRUD_FUNCTION_TYPES[number];

interface PrismaCrudMethodOptions<
  Schema extends Record<string, yup.AnySchema>
> {
  name: string;
  modelName: string;
  prismaOutput: PrismaOutputProvider;
  methodExpression: TypescriptCodeExpression;
  options: {
    [Key in keyof Schema]: yup.InferType<Schema[Key]>;
  };
}

interface PrismaCrudMethodConfig<
  Schema extends Record<string, yup.AnySchema> = Record<string, yup.AnySchema>
> {
  name: CrudFunctionType;
  optionsSchema?: Schema;
  getMethodDefinition: (
    options: PrismaCrudMethodOptions<Schema>
  ) => ServiceOutputMethod;
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
    getMethodDefinition: ({
      name,
      modelName,
      prismaOutput,
      options,
      methodExpression,
    }) => {
      const prismaDefinition = prismaOutput.getPrismaModel(modelName);
      const prismaFields = options.prismaFields.map((fieldName) => {
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
    },
    getMethodExpression: ({ name, modelName, prismaOutput, options }) => {
      const fields = options.prismaFields
        .map((field) => `'${field}'`)
        .join(' | ');

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
    },
  }),
  update: createConfig({
    name: 'update',
    optionsSchema: {
      prismaFields: yup.array(yup.string().required()).required(),
    },
    getMethodDefinition: ({
      name,
      modelName,
      prismaOutput,
      options,
      methodExpression,
    }) => {
      const prismaDefinition = prismaOutput.getPrismaModel(modelName);
      const prismaFields = options.prismaFields.map((fieldName) => {
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
    },
    getMethodExpression: ({ name, modelName, prismaOutput, options }) => {
      const fields = options.prismaFields
        .map((field) => `'${field}'`)
        .join(' | ');

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
    },
  }),
  delete: createConfig({
    name: 'delete',
    getMethodDefinition: ({
      name,
      modelName,
      prismaOutput,
      methodExpression,
    }) => {
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
    },
    getMethodExpression: ({ name, modelName, prismaOutput }) => {
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
    const config = methodConfig[type];
    const methodExpression = prismaCrudService
      .getServiceExpression()
      .append(`.${name}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const methodOptions: PrismaCrudMethodOptions<any> = {
      name,
      modelName,
      prismaOutput,
      options,
      methodExpression,
    };

    prismaCrudService.registerMethod(
      name,
      config.getMethodExpression(methodOptions),
      config.getMethodDefinition(methodOptions)
    );

    return {
      build: async () => {},
    };
  },
});

export default PrismaCrudMethodGenerator;
