import { projectScope } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import type { PrismaDataTransformerFactory } from '#src/providers/prisma/prisma-data-transformable.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
});

export interface PrismaCrudServiceSetupProvider {
  getModelName(): string;
  addTransformer(name: string, factory: PrismaDataTransformerFactory): void;
}

export const prismaCrudServiceSetupProvider =
  createProviderType<PrismaCrudServiceSetupProvider>(
    'prisma-crud-service-setup',
  );

export interface PrismaCrudServiceProvider {
  getTransformerByName(name: string): PrismaDataTransformerFactory;
}

export const prismaCrudServiceProvider =
  createReadOnlyProviderType<PrismaCrudServiceProvider>('prisma-crud-service');

export const prismaCrudServiceGenerator = createGenerator({
  name: 'prisma/prisma-crud-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ modelName }) => ({
    main: createGeneratorTask({
      outputs: {
        prismaCrudService: prismaCrudServiceProvider
          // export to children and project under model name
          .export()
          .andExport(projectScope, modelName),
      },
      exports: {
        prismaCrudServiceSetup: prismaCrudServiceSetupProvider.export(),
      },
      run() {
        const transformers = createNonOverwriteableMap<
          Record<string, PrismaDataTransformerFactory>
        >({});

        return {
          providers: {
            prismaCrudServiceSetup: {
              getModelName() {
                return modelName;
              },
              addTransformer(name, transformer) {
                transformers.set(name, transformer);
              },
            },
          },
          build: () => ({
            prismaCrudService: {
              getTransformerByName(name) {
                const transformer = transformers.get(name);
                if (!transformer) {
                  throw new Error(`Transformer ${name} not found`);
                }
                return transformer;
              },
            },
          }),
        };
      },
    }),
  }),
});
