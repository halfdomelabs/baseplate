import type { AuthComponentImportsProvider } from '@halfdomelabs/react-generators';

import { createTsImportMap } from '@halfdomelabs/core-generators';
import { authComponentsImportsSchema } from '@halfdomelabs/react-generators';
import path from 'node:path/posix';

export function createAuth0ComponentsImports(
  importBase: string,
): AuthComponentImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(authComponentsImportsSchema, {
    RequireAuth: path.join(importBase, 'index.js'),
  });
}
