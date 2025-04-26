import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const serviceContextImportsSchema = createTsImportMapSchema({
  ServiceContext: { isTypeOnly: true },
  createServiceContext: {},
  createTestServiceContext: {},
});

export type ServiceContextImportsProvider = TsImportMapProviderFromSchema<
  typeof serviceContextImportsSchema
>;

export const serviceContextImportsProvider =
  createReadOnlyProviderType<ServiceContextImportsProvider>(
    'service-context-imports',
  );

export function createServiceContextImports(
  importBase: string,
): ServiceContextImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(serviceContextImportsSchema, {
    ServiceContext: path.join(importBase, 'utils/service-context.js'),
    createServiceContext: path.join(importBase, 'utils/service-context.js'),
    createTestServiceContext: path.join(
      importBase,
      'tests/helpers/service-context.test-helper.js',
    ),
  });
}
