import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const rootModuleImportsSchema = createTsImportMapSchema({
  RootModule: {},
  flattenAppModule: {},
});

type RootModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof rootModuleImportsSchema
>;

export const rootModuleImportsProvider =
  createReadOnlyProviderType<RootModuleImportsProvider>('root-module-imports');

export function createRootModuleImports(
  importBase: string,
): RootModuleImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(rootModuleImportsSchema, {
    RootModule: path.join(importBase, 'modules/index.js'),
    flattenAppModule: path.join(importBase, 'utils/app-modules.js'),
  });
}
