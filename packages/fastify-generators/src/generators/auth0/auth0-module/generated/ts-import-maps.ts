import { createTsImportMap } from '@halfdomelabs/core-generators';
import path from 'node:path/posix';

import type { UserSessionServiceImportsProvider } from '../../../auth/_providers/user-session.js';

import { userSessionServiceImportsSchema } from '../../../auth/_providers/user-session.js';

export function createAuth0ModuleImports(
  importBase: string,
): UserSessionServiceImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(userSessionServiceImportsSchema, {
    userSessionService: path.join(importBase, 'user-session.service.js'),
  });
}
