import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const bullMqImportsSchema = createTsImportMapSchema({
  createWorker: {},
  getOrCreateManagedQueue: {},
  ManagedRepeatableJobConfig: { isTypeOnly: true },
  ManagedRepeatableJobsConfig: { isTypeOnly: true },
  synchronizeRepeatableJobs: {},
});

type BullMqImportsProvider = TsImportMapProviderFromSchema<
  typeof bullMqImportsSchema
>;

export const bullMqImportsProvider =
  createReadOnlyProviderType<BullMqImportsProvider>('bull-mq-imports');

export function createBullMqImports(importBase: string): BullMqImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(bullMqImportsSchema, {
    createWorker: path.join(importBase, 'index.js'),
    getOrCreateManagedQueue: path.join(importBase, 'index.js'),
    ManagedRepeatableJobConfig: path.join(importBase, 'index.js'),
    ManagedRepeatableJobsConfig: path.join(importBase, 'index.js'),
    synchronizeRepeatableJobs: path.join(importBase, 'index.js'),
  });
}
