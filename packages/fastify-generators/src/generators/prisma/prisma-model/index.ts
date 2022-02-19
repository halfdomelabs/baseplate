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
  addField(field: PrismaModelField): void;
  addModelAttribute(attribute: PrismaModelAttribute): void;
}

export const prismaModelProvider =
  createProviderType<PrismaModelProvider>('prisma-model');

const PrismaModelGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    fields: {
      provider: 'prisma-field',
      isMultiple: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-field',
      },
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
    return {
      getProviders: () => ({
        prismaModel: {
          getConfig: () => config,
          addField: (field) => prismaModel.addField(field),
          addModelAttribute: (attribute) => prismaModel.addAttribute(attribute),
        },
      }),
      build: () => {
        prisma.addPrismaModel(prismaModel.toBlock());
      },
    };
  },
});

export default PrismaModelGenerator;
