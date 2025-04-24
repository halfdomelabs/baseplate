import type {
  ImportMapper,
  InferTsImportMapFromSchema,
} from '@halfdomelabs/core-generators';

import { createTsImportMapSchema } from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createReadOnlyProviderType,
} from '@halfdomelabs/sync';

export type UserSessionServiceProvider = ImportMapper;

export const userSessionServiceProvider =
  createProviderType<UserSessionServiceProvider>('user-session-service');

export const userSessionServiceImportsSchema = createTsImportMapSchema({
  userSessionService: {},
});

export type UserSessionServiceImportsProvider = InferTsImportMapFromSchema<
  typeof userSessionServiceImportsSchema
>;

export const userSessionServiceImportsProvider =
  createReadOnlyProviderType<UserSessionServiceImportsProvider>(
    'user-session-service-imports',
  );
