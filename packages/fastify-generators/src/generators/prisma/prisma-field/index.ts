import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { snakeCase } from 'change-case';
import * as yup from 'yup';
import { PrismaModelAttribute } from '@src/writers/prisma-schema';
import { prismaModelProvider } from '../prisma-model';

interface PrismaFieldTypeConfig<
  Schema extends Record<string, yup.AnySchema> = Record<string, yup.BaseSchema>
> {
  name: string;
  prismaType: string;
  optionsSchema?: Schema;
  getAttributes?: (config: {
    [Key in keyof Schema]: yup.InferType<Schema[Key]>;
  }) => PrismaModelAttribute[];
}

function createConfig<Schema extends Record<string, yup.AnySchema>>(
  config: PrismaFieldTypeConfig<Schema>
): PrismaFieldTypeConfig<Schema> {
  return config;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validTypes: PrismaFieldTypeConfig<any>[] = [
  { name: 'string', prismaType: 'String' },
  { name: 'int', prismaType: 'Int' },
  createConfig({
    name: 'uuid',
    prismaType: 'String',
    optionsSchema: {
      autoGenerate: yup.boolean(),
    },
    getAttributes: (config) => {
      const attributes: PrismaModelAttribute[] = [{ name: '@db.Uuid' }];
      if (config.autoGenerate) {
        attributes.push({
          name: '@default',
          args: 'dbgenerated("gen_random_uuid()")',
        });
      }
      return attributes;
    },
  }),
  createConfig({
    name: 'dateTime',
    prismaType: 'DateTime',
    optionsSchema: {
      defaultToNow: yup.boolean(),
    },
    getAttributes: (config) => {
      const attributes: PrismaModelAttribute[] = [
        { name: '@db.Timestamptz(3)' },
      ];
      if (config.defaultToNow) {
        attributes.push({
          name: '@default',
          args: 'now()',
        });
      }
      return attributes;
    },
  }),
];

const descriptorSchema = yup.object({
  name: yup.string().required(),
  dbName: yup.string(),
  type: yup
    .string()
    .oneOf(validTypes.map((t) => t.name))
    .required(),
  options: yup
    .object()
    .when('type', ([type]: [string], schema: yup.AnyObjectSchema) =>
      schema.shape(validTypes.find((t) => t.name === type)?.optionsSchema)
    ),
  id: yup.boolean(),
  unique: yup.boolean(),
});

export type PrismaFieldProvider = unknown;

export const prismaFieldProvider =
  createProviderType<PrismaFieldProvider>('prisma-field');

const PrismaFieldGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaModel: prismaModelProvider,
  },
  exports: {
    prismaField: prismaFieldProvider,
  },
  createGenerator(descriptor, { prismaModel }) {
    const attributes: PrismaModelAttribute[] = [];
    const { id, unique, name, options } = descriptor;

    const type = validTypes.find((t) => t.name === descriptor.type);

    if (!type) {
      throw new Error(`Invalid type ${descriptor.type}`);
    }

    const dbName = descriptor.dbName || snakeCase(name);

    if (id) {
      attributes.push({ name: '@id' });
    }

    if (unique) {
      attributes.push({ name: '@unique' });
    }

    if (name !== dbName) {
      attributes.push({ name: '@map', args: `"${dbName}"` });
    }

    attributes.push(...(type.getAttributes?.(options) || []));

    prismaModel.addField({
      name,
      type: type.prismaType,
      attributes,
    });
    return {
      getProviders: () => ({
        prismaField: {},
      }),
      build: () => {},
    };
  },
});

export default PrismaFieldGenerator;
