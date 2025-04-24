import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const userSessionTypesImportsSchema = createTsImportMapSchema({
  UserSessionPayload: { isTypeOnly: true },
  UserSessionService: { isTypeOnly: true },
});

type UserSessionTypesImportsProvider = TsImportMapProviderFromSchema<
  typeof userSessionTypesImportsSchema
>;

export const userSessionTypesImportsProvider =
  createReadOnlyProviderType<UserSessionTypesImportsProvider>(
    'user-session-types-imports',
  );

export function createUserSessionTypesImports(
  importBase: string,
): UserSessionTypesImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(userSessionTypesImportsSchema, {
    UserSessionPayload: path.join(importBase, 'user-session.types.js'),
    UserSessionService: path.join(importBase, 'user-session.types.js'),
  });
}
