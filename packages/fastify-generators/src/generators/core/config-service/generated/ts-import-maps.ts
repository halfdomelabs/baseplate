import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMapProvider,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

export const configServiceImportsSchema = createTsImportMapSchema({
  config: {},
});

export type ConfigServiceImportsProvider = TsImportMapProviderFromSchema<
  typeof configServiceImportsSchema
>;

export const configServiceImportsProvider =
  createReadOnlyProviderType<ConfigServiceImportsProvider>(
    'config-service-imports',
  );

export function createConfigServiceImports(
  importBase: string,
): ConfigServiceImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMapProvider(configServiceImportsSchema, {
    config: path.join(importBase, 'config.js'),
  });
}
