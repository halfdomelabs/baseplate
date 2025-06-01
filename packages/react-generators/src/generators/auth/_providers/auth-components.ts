import {
  createTsImportMapSchema,
  type TsImportMapProviderFromSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export const authComponentsImportsSchema = createTsImportMapSchema({
  RequireAuth: { name: 'default' },
});

export type AuthComponentImportsProvider = TsImportMapProviderFromSchema<
  typeof authComponentsImportsSchema
>;

export const authComponentsImportsProvider =
  createReadOnlyProviderType<AuthComponentImportsProvider>(
    'auth-components-imports',
  );
