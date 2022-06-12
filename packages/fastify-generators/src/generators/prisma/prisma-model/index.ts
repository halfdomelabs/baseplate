import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { snakeCase } from 'change-case';
import { z } from 'zod';
import {
  PrismaModelAttribute,
  PrismaModelBlockWriter,
  PrismaModelField,
} from '@src/writers/prisma-schema';
import { prismaSchemaProvider } from '../prisma';

const descriptorSchema = z.object({
  name: z.string().min(1),
  tableName: z.string().optional(),
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
    uniqueConstraints: {
      isMultiple: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-model-unique',
      },
    },
    generatedFields: {
      isMultiple: true,
    },
  }),
  dependencies: {
    prisma: prismaSchemaProvider.dependency().modifiedInBuild(),
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
    return {
      getProviders: () => ({
        prismaModel: {
          getConfig: () => config,
          getName: () => name,
          addField: (field) => prismaModel.addField(field),
          addModelAttribute: (attribute) => prismaModel.addAttribute(attribute),
        },
      }),
      build: () => {
        prisma.addPrismaModel(prismaModel);
      },
    };
  },
});

export default PrismaModelGenerator;
