import type { InferTsImportMapFromSchema } from '@halfdomelabs/core-generators';

import { createTsImportMapSchema } from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';

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
