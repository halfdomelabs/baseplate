import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const serviceContextImportsSchema = createTsImportMapSchema({
  createServiceContext: {},
  createTestServiceContext: {},
  ServiceContext: { isTypeOnly: true },
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
    createServiceContext: path.join(importBase, 'utils/service-context.js'),
    createTestServiceContext: path.join(
      importBase,
      'tests/helpers/service-context.test-helper.js',
    ),
    ServiceContext: path.join(importBase, 'utils/service-context.js'),
  });
}
