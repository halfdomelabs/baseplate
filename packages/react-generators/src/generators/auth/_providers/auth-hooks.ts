import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import { createTsImportMapSchema } from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export const authHooksImportsSchema = createTsImportMapSchema({
  SessionData: { isTypeOnly: true },
  useLogOut: {},
  useRequiredUserId: {},
  useSession: {},
  AuthRole: { isTypeOnly: true },
});

export type AuthHooksImportsProvider = TsImportMapProviderFromSchema<
  typeof authHooksImportsSchema
>;

export const authHooksImportsProvider =
  createReadOnlyProviderType<AuthHooksImportsProvider>('auth-hooks-imports');
