import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  projectScope,
  tsUtilsProvider,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { serviceContextProvider } from '@src/generators/core/service-context/service-context.generator.js';

import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const descriptorSchema = z.object({});

interface UtilConfig {
  file: string;
  exports: string[];
  dependencies?: string[];
}

const UTIL_CONFIG_MAP: Record<string, UtilConfig> = {
  dataPipes: {
    file: 'data-pipes.ts',
    exports: ['DataPipeOutput', 'mergePipeOperations', 'applyDataPipeOutput'],
    dependencies: [],
  },
  embeddedTypes: {
    file: 'embedded-pipes/embedded-types.ts',
    exports: ['UpsertPayload'],
  },
  embeddedOneToMany: {
    file: 'embedded-pipes/embedded-one-to-many.ts',
    exports: ['createOneToManyCreateData', 'createOneToManyUpsertData'],
    dependencies: ['dataPipes', 'embeddedTypes'],
  },
  embeddedOneToOne: {
    file: 'embedded-pipes/embedded-one-to-one.ts',
    exports: ['createOneToOneCreateData', 'createOneToOneUpsertData'],
    dependencies: ['dataPipes', 'embeddedTypes'],
  },
  prismaRelations: {
    file: 'prisma-relations.ts',
    exports: ['createPrismaDisconnectOrConnectData'],
  },
  crudServiceTypes: {
    file: 'crud-service-types.ts',
    exports: ['CreateServiceInput', 'UpdateServiceInput', 'DeleteServiceInput'],
  },
};

export type PrismaUtilsProvider = ImportMapper;

export const prismaUtilsProvider =
  createProviderType<PrismaUtilsProvider>('prisma-utils');

export const prismaUtilsGenerator = createGenerator({
  name: 'prisma/prisma-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        serviceContext: serviceContextProvider,
        prismaOutput: prismaOutputProvider,
        tsUtils: tsUtilsProvider,
      },
      exports: {
        prismaUtils: prismaUtilsProvider.export(projectScope),
      },
      run({ typescript, serviceContext, prismaOutput, tsUtils }) {
        return {
          providers: {
            prismaUtils: {
              getImportMap: () =>
                Object.fromEntries(
                  Object.entries(UTIL_CONFIG_MAP).map(([key, config]) => [
                    `%prisma-utils/${key}`,
                    {
                      path: `@/src/utils/${config.file.replace(/\.ts$/, '.js')}`,
                      allowedImports: config.exports,
                    },
                  ]),
                ),
            },
          },
          build: async (builder) => {
            // TODO: Dynamically add but it won't work until we have build function running after all dependencies

            // Copy all the util files that were used
            const templateFiles = Object.keys(UTIL_CONFIG_MAP).map(
              (key) => UTIL_CONFIG_MAP[key].file,
            );

            await Promise.all(
              templateFiles.map((file) =>
                builder.apply(
                  typescript.createCopyAction({
                    source: file,
                    destination: `src/utils/${file}`,
                    importMappers: [serviceContext, prismaOutput, tsUtils],
                  }),
                ),
              ),
            );
          },
        };
      },
    }),
  }),
});
