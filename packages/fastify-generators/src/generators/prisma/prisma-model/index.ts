import { projectScope } from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import { snakeCase } from 'change-case';
import { z } from 'zod';

import type {
  PrismaModelAttribute,
  PrismaModelField,
} from '@src/writers/prisma-schema/index.js';

import { PrismaModelBlockWriter } from '@src/writers/prisma-schema/index.js';

import { prismaSchemaProvider } from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  tableName: z.string().optional(),
});

export interface PrismaModelGeneratorConfig {
  setting?: string;
}

export interface PrismaModelProvider {
  getName(): string;
  addField(field: PrismaModelField): void;
  addModelAttribute(attribute: PrismaModelAttribute): void;
}

export const prismaModelProvider =
  createProviderType<PrismaModelProvider>('prisma-model');

const PrismaModelGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    fields: {
      isMultiple: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/prisma/prisma-field',
      },
    },
    relations: {
      isMultiple: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/prisma/prisma-relation-field',
      },
    },
    primaryKey: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/prisma/prisma-model-id',
      },
    },
    indicies: {
      isMultiple: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/prisma/prisma-model-index',
      },
    },
    uniqueConstraints: {
      isMultiple: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/prisma/prisma-model-unique',
      },
    },
    generatedFields: {
      isMultiple: true,
    },
  }),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        prisma: prismaSchemaProvider.dependency(),
      },
      exports: {
        prismaModel: prismaModelProvider
          .export()
          .andExport(projectScope, descriptor.name),
      },
      run: ({ prisma }) => {
        const { name } = descriptor;
        const tableName = descriptor.tableName ?? snakeCase(name);

        const prismaModel = new PrismaModelBlockWriter({ name, tableName });

        return {
          getProviders: () => ({
            prismaModel: {
              getName: () => name,
              addField: (field) => prismaModel.addField(field),
              addModelAttribute: (attribute) =>
                prismaModel.addAttribute(attribute),
            },
          }),
          build: () => {
            prisma.addPrismaModel(prismaModel);
          },
        };
      },
    });
  },
});

export default PrismaModelGenerator;
