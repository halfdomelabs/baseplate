import {
  createTsImportMapSchema,
  type TsImportMapProviderFromSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export const authHooksImportsSchema = createTsImportMapSchema({
  SessionData: { isTypeOnly: true },
  useCurrentUser: {},
  useLogOut: {},
  useRequiredUserId: {},
  useSession: {},
});

export type AuthHooksImportsProvider = TsImportMapProviderFromSchema<
  typeof authHooksImportsSchema
>;

export const authHooksImportsProvider =
  createReadOnlyProviderType<AuthHooksImportsProvider>('auth-hooks-imports');
