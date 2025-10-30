import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { PRISMA_PRISMA_UTILS_PATHS } from './template-paths.js';

export const prismaUtilsImportsSchema = createTsImportMapSchema({
  applyDataPipeOutput: {},
  applyDataPipeOutputToOperations: {},
  applyDataPipeOutputWithoutOperation: {},
  createOneToManyCreateData: {},
  createOneToManyUpsertData: {},
  createOneToOneCreateData: {},
  createOneToOneUpsertData: {},
  createPrismaDisconnectOrConnectData: {},
  CreateServiceInput: { isTypeOnly: true },
  DataPipeOutput: { isTypeOnly: true },
  DeleteServiceInput: { isTypeOnly: true },
  mergePipeOperations: {},
  UpdateServiceInput: { isTypeOnly: true },
  UpsertPayload: { isTypeOnly: true },
});

export type PrismaUtilsImportsProvider = TsImportMapProviderFromSchema<
  typeof prismaUtilsImportsSchema
>;

export const prismaUtilsImportsProvider =
  createReadOnlyProviderType<PrismaUtilsImportsProvider>(
    'prisma-utils-imports',
  );

const prismaPrismaUtilsImportsTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_PRISMA_UTILS_PATHS.provider,
  },
  exports: {
    prismaUtilsImports: prismaUtilsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        prismaUtilsImports: createTsImportMap(prismaUtilsImportsSchema, {
          applyDataPipeOutput: paths.dataPipes,
          applyDataPipeOutputToOperations: paths.dataPipes,
          applyDataPipeOutputWithoutOperation: paths.dataPipes,
          createOneToManyCreateData: paths.embeddedOneToMany,
          createOneToManyUpsertData: paths.embeddedOneToMany,
          createOneToOneCreateData: paths.embeddedOneToOne,
          createOneToOneUpsertData: paths.embeddedOneToOne,
          createPrismaDisconnectOrConnectData: paths.prismaRelations,
          CreateServiceInput: paths.crudServiceTypes,
          DataPipeOutput: paths.dataPipes,
          DeleteServiceInput: paths.crudServiceTypes,
          mergePipeOperations: paths.dataPipes,
          UpdateServiceInput: paths.crudServiceTypes,
          UpsertPayload: paths.embeddedTypes,
        }),
      },
    };
  },
});

export const PRISMA_PRISMA_UTILS_IMPORTS = {
  task: prismaPrismaUtilsImportsTask,
};
