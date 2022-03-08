import { snakeCase } from 'change-case';
import * as yup from 'yup';
import { ScalarFieldType } from '@src/types/fieldTypes';
import { PrismaModelAttribute, PrismaModelField } from './model-writer';

type GetConfigType<Schema extends Record<string, yup.AnySchema>> = {
  [Key in keyof Schema]: yup.InferType<Schema[Key]>;
};

export interface PrismaFieldTypeConfig<
  // without any, types get messed up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Schema extends Record<string, yup.AnySchema> = any
> {
  prismaType: string;
  optionsSchema: Schema;
  getAttributes?: (config?: GetConfigType<Schema>) => PrismaModelAttribute[];
}

function createConfig<Schema extends Record<string, yup.AnySchema>>(
  config: PrismaFieldTypeConfig<Schema>
): PrismaFieldTypeConfig<Schema> {
  return config;
}

function createConfigMap<
  T extends Record<ScalarFieldType, PrismaFieldTypeConfig>
>(configMap: T): T {
  return configMap;
}

export const PRISMA_SCALAR_FIELD_TYPES = createConfigMap({
  string: { prismaType: 'String', optionsSchema: {} },
  int: { prismaType: 'Int', optionsSchema: {} },
  float: { prismaType: 'Float', optionsSchema: {} },
  decimal: { prismaType: 'Decimal', optionsSchema: {} },
  boolean: { prismaType: 'Boolean', optionsSchema: {} },
  json: { prismaType: 'JSON', optionsSchema: {} },
  uuid: createConfig({
    prismaType: 'String',
    optionsSchema: {
      autoGenerate: yup.boolean(),
    },
    getAttributes: (config) => {
      const attributes: PrismaModelAttribute[] = [{ name: '@db.Uuid' }];
      if (config?.autoGenerate) {
        attributes.push({
          name: '@default',
          args: ['dbgenerated("gen_random_uuid()")'],
        });
      }
      return attributes;
    },
  }),
  dateTime: createConfig({
    prismaType: 'DateTime',
    optionsSchema: {
      defaultToNow: yup.boolean(),
    },
    getAttributes: (config) => {
      const attributes: PrismaModelAttribute[] = [
        { name: '@db.Timestamptz', args: ['3'] },
      ];
      if (config?.defaultToNow) {
        attributes.push({
          name: '@default',
          args: ['now()'],
        });
      }
      return attributes;
    },
  }),
});

export function buildPrismaScalarField<T extends ScalarFieldType>(
  name: string,
  type: ScalarFieldType,
  options?: {
    id?: boolean;
    unique?: boolean;
    optional?: boolean;
    dbName?: string;
    typeOptions?: GetConfigType<
      typeof PRISMA_SCALAR_FIELD_TYPES[T]['optionsSchema']
    >;
  }
): PrismaModelField {
  const typeConfig: PrismaFieldTypeConfig = PRISMA_SCALAR_FIELD_TYPES[type];

  if (!typeConfig) {
    throw new Error(`Invalid type ${type}`);
  }

  const {
    id,
    unique,
    optional,
    dbName = snakeCase(name),
    typeOptions,
  } = options || {};
  const attributes: PrismaModelAttribute[] = [];

  if (id) {
    attributes.push({ name: '@id' });
  }

  if (unique) {
    attributes.push({ name: '@unique' });
  }

  if (name !== dbName) {
    attributes.push({ name: '@map', args: [`"${dbName}"`] });
  }

  attributes.push(...(typeConfig.getAttributes?.(typeOptions) || []));

  return {
    name,
    type: `${typeConfig.prismaType}${optional ? '?' : ''}`,
    attributes,
    fieldType: 'scalar',
    scalarType: type,
  };
}
