import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { z } from 'zod';
import { ScalarFieldType } from '@src/types/fieldTypes';
import {
  buildPrismaScalarField,
  PrismaFieldTypeConfig,
  PRISMA_SCALAR_FIELD_TYPES,
} from '@src/writers/prisma-schema/fields';
import { prismaModelProvider } from '../prisma-model';

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
        ...ScalarFieldType[]
      ]
    ),
    options: z.object({}).catchall(z.any()).optional(),
    id: z.boolean().optional(),
    unique: z.boolean().optional(),
    optional: z.boolean().optional(),
  })
  .superRefine((obj, ctx) => {
    // TODO: Clean up
    const schema = prismaScalarFieldTypes[obj.type]?.optionsSchema;
    if (schema) {
      const parseResult = schema.safeParse(obj.options || {});
      if (!parseResult.success) {
        ctx.addIssue(parseResult.error.errors[0]);
      }
    }
    return obj;
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
    const { name, type, id, unique, options, optional, dbName } = descriptor;

    const prismaField = buildPrismaScalarField(name, type, {
      id,
      unique,
      optional,
      dbName,
      typeOptions: options,
    });

    prismaModel.addField(prismaField);
    return {
      getProviders: () => ({
        prismaField: {},
      }),
      build: () => {},
    };
  },
});

export default PrismaFieldGenerator;
