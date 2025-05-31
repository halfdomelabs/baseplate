import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const configServiceImportsSchema = createTsImportMapSchema({ config: {} });

type ConfigServiceImportsProvider = TsImportMapProviderFromSchema<
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

  return createTsImportMap(configServiceImportsSchema, {
    config: path.join(importBase, 'config.js'),
  });
}
