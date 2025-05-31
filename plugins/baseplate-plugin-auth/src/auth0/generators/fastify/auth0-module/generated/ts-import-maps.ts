import type { UserSessionServiceImportsProvider } from '@baseplate-dev/fastify-generators';

import { createTsImportMap } from '@baseplate-dev/core-generators';
import { userSessionServiceImportsSchema } from '@baseplate-dev/fastify-generators';
import path from 'node:path/posix';

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
