import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const appModuleSetupImportsSchema = createTsImportMapSchema({
  flattenAppModule: {},
});

type AppModuleSetupImportsProvider = TsImportMapProviderFromSchema<
  typeof appModuleSetupImportsSchema
>;

export const appModuleSetupImportsProvider =
  createReadOnlyProviderType<AppModuleSetupImportsProvider>(
    'app-module-setup-imports',
  );

export function createAppModuleSetupImports(
  importBase: string,
): AppModuleSetupImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(appModuleSetupImportsSchema, {
    flattenAppModule: path.join(importBase, 'app-modules.js'),
  });
}
