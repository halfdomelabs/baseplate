import {
  ImportMapper,
  tsUtilsProvider,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { serviceContextProvider } from '@src/generators/core/service-context';
import { prismaOutputProvider } from '../prisma';

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
};

export type PrismaUtilsProvider = ImportMapper;

export const prismaUtilsProvider =
  createProviderType<PrismaUtilsProvider>('prisma-utils');

/**
 * Generator for Typescript utility functions like notEmpty
 */
const PrismaUtilsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    serviceContext: serviceContextProvider,
    prismaOutput: prismaOutputProvider,
    tsUtils: tsUtilsProvider,
  },
  exports: {
    prismaUtils: prismaUtilsProvider,
  },
  createGenerator(
    descriptor,
    { typescript, serviceContext, prismaOutput, tsUtils }
  ) {
    return {
      getProviders: () => ({
        prismaUtils: {
          getImportMap: () =>
            Object.entries(UTIL_CONFIG_MAP).reduce(
              (acc, [key, config]) => ({
                ...acc,
                [`%prisma-utils/${key}`]: {
                  path: `@/src/utils/${config.file.replace(/\.ts$/, '')}`,
                  allowedImports: config.exports,
                },
              }),
              {}
            ),
        },
      }),
      build: async (builder) => {
        // TODO: Dynamically add but it won't work until we have build function running after all dependencies

        // Copy all the util files that were used
        const templateFiles = Object.keys(UTIL_CONFIG_MAP).map(
          (key) => UTIL_CONFIG_MAP[key].file
        );

        await Promise.all(
          templateFiles.map((file) =>
            builder.apply(
              typescript.createCopyAction({
                source: file,
                destination: `src/utils/${file}`,
                importMappers: [serviceContext, prismaOutput, tsUtils],
              })
            )
          )
        );
      },
    };
  },
});

export default PrismaUtilsGenerator;
