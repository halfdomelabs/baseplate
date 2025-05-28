import { createTsImportMap } from '@halfdomelabs/core-generators';
import path from 'node:path/posix';

import type { UserSessionServiceImportsProvider } from '../../_providers/user-session.js';

import { userSessionServiceImportsSchema } from '../../_providers/user-session.js';

export function createPlaceholderAuthServiceImports(
  importBase: string,
): UserSessionServiceImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(userSessionServiceImportsSchema, {
    userSessionService: path.join(importBase, 'user-session.service.js'),
  });
}
