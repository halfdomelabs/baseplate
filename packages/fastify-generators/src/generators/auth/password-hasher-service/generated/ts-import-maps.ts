import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const passwordHasherServiceImportsSchema = createTsImportMapSchema({
  createPasswordHash: {},
  verifyPasswordHash: {},
});

type PasswordHasherServiceImportsProvider = TsImportMapProviderFromSchema<
  typeof passwordHasherServiceImportsSchema
>;

export const passwordHasherServiceImportsProvider =
  createReadOnlyProviderType<PasswordHasherServiceImportsProvider>(
    'password-hasher-service-imports',
  );

export function createPasswordHasherServiceImports(
  importBase: string,
): PasswordHasherServiceImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(passwordHasherServiceImportsSchema, {
    createPasswordHash: path.join(importBase, 'password-hasher.service.js'),
    verifyPasswordHash: path.join(importBase, 'password-hasher.service.js'),
  });
}
