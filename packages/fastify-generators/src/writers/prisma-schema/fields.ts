import { snakeCase } from 'change-case';
import { z } from 'zod';
import { ScalarFieldType } from '@src/types/fieldTypes';
import { doubleQuot } from '@src/utils/string';
import { PrismaModelAttribute, PrismaModelField } from './model-writer';

export interface PrismaFieldTypeConfig<
  Schema extends z.ZodType = z.AnyZodObject
> {
  optionsSchema?: Schema;
  prismaType: string;
  getAttributes?: (config?: z.infer<Schema>) => PrismaModelAttribute[];
}

function createConfig<Schema extends z.AnyZodObject>(
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
  string: createConfig({
    prismaType: 'String',
    optionsSchema: z.object({
      default: z.string().optional(),
    }),
    getAttributes: (config) => {
      if (config?.default) {
        return [{ name: '@default', args: [doubleQuot(config.default)] }];
      }
      return [];
    },
  }),
  int: {
    prismaType: 'Int',
    optionsSchema: z.object({
      default: z.string().optional(),
    }),
    getAttributes: (config) => {
      if (config?.default) {
        return [{ name: '@default', args: [config.default] }];
      }
      return [];
    },
  },
  float: {
    prismaType: 'Float',
    optionsSchema: z.object({
      default: z.string().optional(),
    }),
    getAttributes: (config) => {
      if (config?.default) {
        return [{ name: '@default', args: [config.default] }];
      }
      return [];
    },
  },
  decimal: { prismaType: 'Decimal' },
  boolean: {
    prismaType: 'Boolean',
    optionsSchema: z.object({
      default: z.string().optional(),
    }),
    getAttributes: (config) => {
      if (config?.default) {
        return [{ name: '@default', args: [config.default] }];
      }
      return [];
    },
  },
  json: { prismaType: 'JSON' },
  uuid: createConfig({
    prismaType: 'String',
    optionsSchema: z.object({
      autoGenerate: z.boolean().optional(),
    }),
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
    optionsSchema: z.object({
      defaultToNow: z.boolean().optional(),
      updatedAt: z.boolean().optional(),
    }),
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
      if (config?.updatedAt) {
        attributes.push({
          name: '@updatedAt',
        });
      }
      return attributes;
    },
  }),
  date: createConfig({
    prismaType: 'DateTime',
    optionsSchema: z.object({
      defaultToNow: z.boolean().optional(),
    }),
    getAttributes: (config) => {
      const attributes: PrismaModelAttribute[] = [{ name: '@db.Date' }];
      if (config?.defaultToNow) {
        attributes.push({
          name: '@default',
          args: ['now()'],
        });
      }
      return attributes;
    },
  }),
  enum: createConfig({
    prismaType: '',
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
    enumType?: string;
    typeOptions?: typeof PRISMA_SCALAR_FIELD_TYPES[T] extends {
      optionsSchema: z.ZodType;
    }
      ? z.infer<typeof PRISMA_SCALAR_FIELD_TYPES[T]['optionsSchema']>
      : unknown;
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
    enumType,
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

  attributes.push(
    ...(typeConfig.getAttributes?.(typeOptions as Record<string, unknown>) ||
      [])
  );

  const prismaType = type === 'enum' ? enumType : typeConfig.prismaType;

  if (!prismaType) {
    throw new Error(`Prisma type required ${type}`);
  }

  return {
    name,
    type: `${prismaType}${optional ? '?' : ''}`,
    attributes,
    fieldType: 'scalar',
    scalarType: type,
    enumType,
  };
}
