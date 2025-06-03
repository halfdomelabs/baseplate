import type { InferTsImportMapFromSchema } from '@baseplate-dev/core-generators';

import { createTsImportMapSchema } from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';

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
