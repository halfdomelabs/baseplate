import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const prismaUtilsImportsSchema = createTsImportMapSchema({
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

export function createPrismaUtilsImports(
  importBase: string,
): PrismaUtilsImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(prismaUtilsImportsSchema, {
    applyDataPipeOutput: path.join(importBase, 'data-pipes.js'),
    applyDataPipeOutputToOperations: path.join(importBase, 'data-pipes.js'),
    applyDataPipeOutputWithoutOperation: path.join(importBase, 'data-pipes.js'),
    createOneToManyCreateData: path.join(
      importBase,
      'embedded-pipes/embedded-one-to-many.js',
    ),
    createOneToManyUpsertData: path.join(
      importBase,
      'embedded-pipes/embedded-one-to-many.js',
    ),
    createOneToOneCreateData: path.join(
      importBase,
      'embedded-pipes/embedded-one-to-one.js',
    ),
    createOneToOneUpsertData: path.join(
      importBase,
      'embedded-pipes/embedded-one-to-one.js',
    ),
    createPrismaDisconnectOrConnectData: path.join(
      importBase,
      'prisma-relations.js',
    ),
    CreateServiceInput: path.join(importBase, 'crud-service-types.js'),
    DataPipeOutput: path.join(importBase, 'data-pipes.js'),
    DeleteServiceInput: path.join(importBase, 'crud-service-types.js'),
    mergePipeOperations: path.join(importBase, 'data-pipes.js'),
    UpdateServiceInput: path.join(importBase, 'crud-service-types.js'),
    UpsertPayload: path.join(importBase, 'embedded-pipes/embedded-types.js'),
  });
}
