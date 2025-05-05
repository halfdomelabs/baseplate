import {
  createTsImportMapSchema,
  type TsImportMapProviderFromSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';

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
