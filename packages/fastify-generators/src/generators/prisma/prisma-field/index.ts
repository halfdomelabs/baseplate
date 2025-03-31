import { createGenerator } from '@halfdomelabs/sync';
import { z } from 'zod';

import type { ScalarFieldType } from '@src/types/field-types.js';
import type { PrismaFieldTypeConfig } from '@src/writers/prisma-schema/fields.js';

import {
  buildPrismaScalarField,
  PRISMA_SCALAR_FIELD_TYPES,
} from '@src/writers/prisma-schema/fields.js';

import { prismaModelProvider } from '../prisma-model/index.js';

// some typescript hacking to make field types work generically
const prismaScalarFieldTypes = PRISMA_SCALAR_FIELD_TYPES as Record<
  ScalarFieldType,
  PrismaFieldTypeConfig
>;

const descriptorSchema = z
  .object({
    name: z.string().min(1),
    dbName: z.string().optional(),
    type: z.enum(
      Object.keys(prismaScalarFieldTypes) as [
        ScalarFieldType,
        ...ScalarFieldType[],
      ],
    ),
    options: z.object({}).catchall(z.any()).optional(),
    id: z.boolean().optional(),
    unique: z.boolean().optional(),
    optional: z.boolean().optional(),
    enumType: z.string().optional(),
  })
  .superRefine((obj, ctx) => {
    // TODO: Clean up
    const schema = prismaScalarFieldTypes[obj.type].optionsSchema;
    if (schema && obj.options) {
      const parseResult = schema.safeParse(obj.options);
      if (!parseResult.success) {
        ctx.addIssue(parseResult.error.errors[0]);
      }
    }
    return obj;
  });

export type PrismaFieldDescriptor = z.infer<typeof descriptorSchema>;

export const prismaFieldGenerator = createGenerator({
  name: 'prisma/prisma-field',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        prismaModel: prismaModelProvider,
      },
      run({ prismaModel }) {
        const { name, type, id, unique, options, optional, dbName, enumType } =
          descriptor;

        if (type === 'enum' && !enumType) {
          throw new Error(`Enum type required`);
        }

        if (enumType && type !== 'enum') {
          throw new Error(`Enum type can only be used with type 'enum'`);
        }

        const prismaField = buildPrismaScalarField(name, type, {
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
    });
  },
});
