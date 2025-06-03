import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const reactConfigImportsSchema = createTsImportMapSchema({ config: {} });

type ReactConfigImportsProvider = TsImportMapProviderFromSchema<
  typeof reactConfigImportsSchema
>;

export const reactConfigImportsProvider =
  createReadOnlyProviderType<ReactConfigImportsProvider>(
    'react-config-imports',
  );

export function createReactConfigImports(
  importBase: string,
): ReactConfigImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(reactConfigImportsSchema, {
    config: path.join(importBase, 'config.js'),
  });
}
