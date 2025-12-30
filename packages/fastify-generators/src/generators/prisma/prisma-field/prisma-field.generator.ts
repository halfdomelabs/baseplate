import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import type { ScalarFieldType } from '#src/types/field-types.js';

import {
  buildPrismaScalarField,
  PRISMA_SCALAR_FIELD_TYPES,
} from '#src/writers/prisma-schema/fields.js';

import { prismaModelProvider } from '../prisma-model/index.js';

const baseFieldSchema = z.object({
  name: z.string().min(1),
  order: z.int().nonnegative(),
  dbName: z.string().optional(),
  id: z.boolean().optional(),
  unique: z.boolean().optional(),
  optional: z.boolean().optional(),
  enumType: z.string().optional(),
  type: z.enum(
    Object.keys(PRISMA_SCALAR_FIELD_TYPES) as [
      ScalarFieldType,
      ...ScalarFieldType[],
    ],
  ),
  options: z.unknown(),
});

const fieldTypeSchemas = Object.entries(PRISMA_SCALAR_FIELD_TYPES).map(
  ([type, config]) =>
    baseFieldSchema.extend({
      type: z.literal(type),
      options:
        'optionsSchema' in config
          ? config.optionsSchema
          : z.object({}).optional(),
    }),
) as unknown as [typeof baseFieldSchema, ...(typeof baseFieldSchema)[]];

const descriptorSchema = z.discriminatedUnion('type', fieldTypeSchemas);

export type PrismaFieldDescriptor = z.infer<typeof descriptorSchema>;

export const prismaFieldGenerator = createGenerator({
  name: 'prisma/prisma-field',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaModel: prismaModelProvider,
      },
      run({ prismaModel }) {
        const {
          name,
          type,
          id,
          unique,
          options,
          optional,
          dbName,
          enumType,
          order,
        } = descriptor;

        if (type === 'enum' && !enumType) {
          throw new Error(`Enum type required`);
        }

        if (enumType && type !== 'enum') {
          throw new Error(`Enum type can only be used with type 'enum'`);
        }

        const prismaField = buildPrismaScalarField(name, type, order, {
          id,
          unique,
          optional,
          dbName,
          typeOptions: options,
          enumType,
        });

        prismaModel.addField(prismaField);
        return {};
      },
    }),
  }),
});
