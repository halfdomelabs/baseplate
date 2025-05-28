import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';
import type { UserSessionServiceImportsProvider } from '@halfdomelabs/fastify-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { userSessionServiceImportsSchema } from '@halfdomelabs/fastify-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const authModuleImportsSchema = createTsImportMapSchema({
  getUserSessionCookieName: {},
  sign: {},
  signObject: {},
  unsign: {},
  unsignObject: {},
  USER_SESSION_DURATION_SEC: {},
  USER_SESSION_MAX_LIFETIME_SEC: {},
  USER_SESSION_RENEWAL_THRESHOLD_SEC: {},
  userSessionPayload: {},
  verifyRequestOrigin: {},
});

type AuthModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof authModuleImportsSchema
>;

export const authModuleImportsProvider =
  createReadOnlyProviderType<AuthModuleImportsProvider>('auth-module-imports');

export function createAuthModuleImports(
  importBase: string,
): AuthModuleImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(authModuleImportsSchema, {
    getUserSessionCookieName: path.join(importBase, 'utils/session-cookie.js'),
    sign: path.join(importBase, 'utils/cookie-signer.js'),
    signObject: path.join(importBase, 'utils/cookie-signer.js'),
    unsign: path.join(importBase, 'utils/cookie-signer.js'),
    unsignObject: path.join(importBase, 'utils/cookie-signer.js'),
    USER_SESSION_DURATION_SEC: path.join(
      importBase,
      'constants/user-session.constants.js',
    ),
    USER_SESSION_MAX_LIFETIME_SEC: path.join(
      importBase,
      'constants/user-session.constants.js',
    ),
    USER_SESSION_RENEWAL_THRESHOLD_SEC: path.join(
      importBase,
      'constants/user-session.constants.js',
    ),
    userSessionPayload: path.join(
      importBase,
      'schema/user-session-payload.object-type.js',
    ),
    verifyRequestOrigin: path.join(
      importBase,
      'utils/verify-request-origin.js',
    ),
  });
}

export function createUserSessionServiceImports(
  importBase: string,
): UserSessionServiceImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(userSessionServiceImportsSchema, {
    userSessionService: path.join(importBase, 'user-session.service.js'),
  });
}
