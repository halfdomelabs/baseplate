import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const authRolesImportsSchema = createTsImportMapSchema({
  AuthRole: { isTypeOnly: true },
  DEFAULT_PUBLIC_ROLES: {},
  DEFAULT_USER_ROLES: {},
  RoleConfig: { isTypeOnly: true },
});

type AuthRolesImportsProvider = TsImportMapProviderFromSchema<
  typeof authRolesImportsSchema
>;

export const authRolesImportsProvider =
  createReadOnlyProviderType<AuthRolesImportsProvider>('auth-roles-imports');

export function createAuthRolesImports(
  importBase: string,
): AuthRolesImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(authRolesImportsSchema, {
    AuthRole: path.join(importBase, 'auth-roles.constants.js'),
    DEFAULT_PUBLIC_ROLES: path.join(importBase, 'auth-roles.constants.js'),
    DEFAULT_USER_ROLES: path.join(importBase, 'auth-roles.constants.js'),
    RoleConfig: path.join(importBase, 'auth-roles.constants.js'),
  });
}
