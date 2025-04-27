import {
  createTsImportMapSchema,
  type ImportMapper,
  type TsImportMapProviderFromSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';

export type AuthHooksProvider = ImportMapper;

export const authHooksProvider =
  createReadOnlyProviderType<AuthHooksProvider>('auth-hooks');

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
