import { createTsImportMap } from '@halfdomelabs/core-generators';
import path from 'node:path/posix';

import type { AuthComponentImportsProvider } from '../../../auth/_providers/auth-components.js';

import { authComponentsImportsSchema } from '../../../auth/_providers/auth-components.js';

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
