import {
  createTsImportMapSchema,
  type ImportMapper,
  type TsImportMapProviderFromSchema,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createReadOnlyProviderType,
} from '@halfdomelabs/sync';

export type AuthComponentsProvider = ImportMapper;

export const authComponentsProvider =
  createProviderType<AuthComponentsProvider>('auth-components');

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
