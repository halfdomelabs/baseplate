import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const authContextImportsSchema = createTsImportMapSchema({
  AuthContext: { isTypeOnly: true },
  AuthSessionInfo: { isTypeOnly: true },
  AuthUserSessionInfo: { isTypeOnly: true },
  createAuthContextFromSessionInfo: {},
  InvalidSessionError: {},
});

type AuthContextImportsProvider = TsImportMapProviderFromSchema<
  typeof authContextImportsSchema
>;

export const authContextImportsProvider =
  createReadOnlyProviderType<AuthContextImportsProvider>(
    'auth-context-imports',
  );

export function createAuthContextImports(
  importBase: string,
): AuthContextImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(authContextImportsSchema, {
    AuthContext: path.join(importBase, 'types/auth-context.types.js'),
    AuthSessionInfo: path.join(importBase, 'types/auth-session.types.js'),
    AuthUserSessionInfo: path.join(importBase, 'types/auth-session.types.js'),
    createAuthContextFromSessionInfo: path.join(
      importBase,
      'utils/auth-context.utils.js',
    ),
    InvalidSessionError: path.join(importBase, 'types/auth-session.types.js'),
  });
}
