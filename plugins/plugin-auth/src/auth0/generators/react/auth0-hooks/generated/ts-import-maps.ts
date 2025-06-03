import type { AuthHooksImportsProvider } from '@baseplate-dev/react-generators';

import { createTsImportMap } from '@baseplate-dev/core-generators';
import { authHooksImportsSchema } from '@baseplate-dev/react-generators';
import path from 'node:path/posix';

export function createAuth0HooksImports(
  importBase: string,
): AuthHooksImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(authHooksImportsSchema, {
    SessionData: path.join(importBase, 'useSession.js'),
    useCurrentUser: path.join(importBase, 'useCurrentUser.js'),
    useLogOut: path.join(importBase, 'useLogOut.js'),
    useRequiredUserId: path.join(importBase, 'useRequiredUserId.js'),
    useSession: path.join(importBase, 'useSession.js'),
  });
}
