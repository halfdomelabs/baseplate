import { packageScope } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { snakeCase } from 'change-case';
import { z } from 'zod';

import type {
  PrismaModelAttribute,
  PrismaModelField,
} from '#src/writers/prisma-schema/index.js';

import { PrismaModelBlockWriter } from '#src/writers/prisma-schema/index.js';

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

export const prismaModelGenerator = createGenerator({
  name: 'prisma/prisma-model',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        prisma: prismaSchemaProvider.dependency(),
      },
      exports: {
        prismaModel: prismaModelProvider
          .export()
          .andExport(packageScope, descriptor.name),
      },
      run: ({ prisma }) => {
        const { name } = descriptor;
        const tableName = descriptor.tableName ?? snakeCase(name);

        const prismaModel = new PrismaModelBlockWriter({ name, tableName });

        return {
          providers: {
            prismaModel: {
              getName: () => name,
              addField: (field) => prismaModel.addField(field),
              addModelAttribute: (attribute) =>
                prismaModel.addAttribute(attribute),
            },
          },
          build: () => {
            prisma.addPrismaModel(prismaModel);
          },
        };
      },
    }),
  }),
});
