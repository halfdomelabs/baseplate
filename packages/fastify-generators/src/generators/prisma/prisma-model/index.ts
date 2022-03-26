import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { snakeCase } from 'change-case';
import * as yup from 'yup';
import {
  PrismaModelAttribute,
  PrismaModelBlockWriter,
  PrismaModelField,
} from '@src/writers/prisma-schema';
import { prismaSchemaProvider } from '../prisma';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  tableName: yup.string(),
});

export interface PrismaModelGeneratorConfig {
  setting?: string;
}

export interface PrismaModelProvider {
  getConfig(): NonOverwriteableMap<PrismaModelGeneratorConfig>;
  getName(): string;
  addField(field: PrismaModelField): void;
  addModelAttribute(attribute: PrismaModelAttribute): void;
}

export const prismaModelProvider =
  createProviderType<PrismaModelProvider>('prisma-model');

const PrismaModelGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    fields: {
      isMultiple: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-field',
      },
    },
    relations: {
      isMultiple: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-relation-field',
      },
    },
    primaryKey: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-model-id',
      },
    },
    indicies: {
      isMultiple: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-model-index',
      },
    },
    generatedFields: {
      isMultiple: true,
    },
  }),
  dependencies: {
    prisma: prismaSchemaProvider,
  },
  exports: {
    prismaModel: prismaModelProvider,
  },
  createGenerator(descriptor, { prisma }) {
    const { name } = descriptor;
    const tableName = descriptor.tableName || snakeCase(name);

    const prismaModel = new PrismaModelBlockWriter({ name, tableName });

    const config = createNonOverwriteableMap(
      {},
      { name: 'prisma-model-config' }
    );
    // TODO: (IMPORTANT) Use post provider hooks
    prisma.addPrismaModel(prismaModel);
    return {
      getProviders: () => ({
        prismaModel: {
          getConfig: () => config,
          getName: () => name,
          addField: (field) => prismaModel.addField(field),
          addModelAttribute: (attribute) => prismaModel.addAttribute(attribute),
        },
      }),
      build: () => {},
    };
  },
});

export default PrismaModelGenerator;
