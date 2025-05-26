import type { UserSessionServiceImportsProvider } from '@halfdomelabs/fastify-generators';

import { createTsImportMap } from '@halfdomelabs/core-generators';
import { userSessionServiceImportsSchema } from '@halfdomelabs/fastify-generators';
import path from 'node:path/posix';

export function createAuthModuleImports(
  importBase: string,
): UserSessionServiceImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(userSessionServiceImportsSchema, {
    userSessionService: path.join(importBase, 'user-session.service.js'),
  });
}
