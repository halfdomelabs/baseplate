import { snakeCase } from 'change-case';
import { z } from 'zod';

import type { ScalarFieldType } from '#src/types/field-types.js';

import { doubleQuot } from '#src/utils/string.js';

import type { PrismaModelAttribute, PrismaModelField } from './model-writer.js';

interface PrismaFieldTypeConfig<Schema extends z.ZodType = z.ZodObject> {
  optionsSchema?: Schema;
  prismaType: string;
  getAttributes?: (config?: z.infer<Schema>) => PrismaModelAttribute[];
}

function createConfig<Schema extends z.ZodObject>(
  config: PrismaFieldTypeConfig<Schema>,
): PrismaFieldTypeConfig<Schema> {
  return config;
}

function createConfigMap<
  T extends Record<ScalarFieldType, PrismaFieldTypeConfig>,
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
  int: createConfig({
    prismaType: 'Int',
    optionsSchema: z.object({
      default: z
        .string()
        .regex(/^-?\d*$/, {
          message: 'Default value must be a number',
        })
        .optional(),
    }),
    getAttributes: (config) => {
      if (config?.default) {
        return [{ name: '@default', args: [config.default] }];
      }
      return [];
    },
  }),
  float: createConfig({
    prismaType: 'Float',
    optionsSchema: z.object({
      default: z
        .string()
        .regex(/^-?\d*\.?\d*$/, {
          message: 'Default value must be a float',
        })
        .optional(),
    }),
    getAttributes: (config) => {
      if (config?.default) {
        return [{ name: '@default', args: [config.default] }];
      }
      return [];
    },
  }),
  decimal: { prismaType: 'Decimal' },
  boolean: createConfig({
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
  }),
  json: { prismaType: 'Json' },
  jsonObject: { prismaType: 'Json' },
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
    optionsSchema: z.object({
      defaultEnumValue: z.string().optional(),
    }),
    getAttributes: (config) => {
      if (config?.defaultEnumValue) {
        return [{ name: '@default', args: [config.defaultEnumValue] }];
      }
      return [];
    },
  }),
});

export function buildPrismaScalarField<T extends ScalarFieldType>(
  name: string,
  type: ScalarFieldType,
  order: number,
  options?: {
    id?: boolean;
    unique?: boolean;
    optional?: boolean;
    dbName?: string;
    enumType?: string;
    typeOptions?: (typeof PRISMA_SCALAR_FIELD_TYPES)[T] extends {
      optionsSchema: z.ZodType;
    }
      ? z.infer<(typeof PRISMA_SCALAR_FIELD_TYPES)[T]['optionsSchema']>
      : unknown;
  },
): PrismaModelField {
  if (!(type in PRISMA_SCALAR_FIELD_TYPES)) {
    throw new Error(`Invalid type ${type}`);
  }
  const typeConfig: PrismaFieldTypeConfig = PRISMA_SCALAR_FIELD_TYPES[type];

  const {
    id,
    unique,
    optional,
    dbName = snakeCase(name),
    typeOptions,
    enumType,
  } = options ?? {};
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
    ...(typeConfig.getAttributes?.(typeOptions as Record<string, unknown>) ??
      []),
  );

  const prismaType = type === 'enum' ? enumType : typeConfig.prismaType;

  if (!prismaType) {
    throw new Error(`Prisma type required ${type}`);
  }

  return {
    name,
    type: prismaType,
    isOptional: optional,
    attributes,
    order,
    fieldType: 'scalar',
    scalarType: type,
    enumType,
  };
}
