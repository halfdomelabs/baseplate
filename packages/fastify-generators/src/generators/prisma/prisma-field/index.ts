import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
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

const descriptorSchema = yup.object({
  name: yup.string().required(),
  dbName: yup.string(),
  type: yup
    .mixed<ScalarFieldType>()
    .oneOf(Object.keys(prismaScalarFieldTypes) as ScalarFieldType[])
    .required(),
  options: yup
    .object()
    .when('type', ([type]: [ScalarFieldType], schema: yup.AnyObjectSchema) =>
      schema.shape(prismaScalarFieldTypes[type]?.optionsSchema)
    ),
  id: yup.boolean(),
  unique: yup.boolean(),
  optional: yup.boolean(),
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
