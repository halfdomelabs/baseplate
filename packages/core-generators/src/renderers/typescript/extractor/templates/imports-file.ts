export const IMPORTS_FILE_TEMPLATE = `
import { createReadOnlyProviderType } from '@halfdomelabs/sync';

import type { TsImportMapProviderFromSchema } from 'TPL_TS_IMPORTS';

import {
  createTsImportMapProvider,
  createTsImportMapSchema,
} from 'TPL_TS_IMPORTS';

export const TPL_IMPORTS_SCHEMA_VAR =
  createTsImportMapSchema(TPL_IMPORTS_SCHEMA);

export type TPL_IMPORTS_PROVIDER_TYPE_VAR = TsImportMapProviderFromSchema<
  typeof TPL_IMPORTS_SCHEMA_VAR
>;

export const TPL_IMPORTS_PROVIDER_VAR =
  createReadOnlyProviderType<TPL_IMPORTS_PROVIDER_TYPE_VAR>(
    'TPL_PROVIDER_NAME',
  );

export function TPL_CREATE_IMPORT_MAP_FUNCTION(
  baseDirectory: string,
): TPL_IMPORTS_PROVIDER_TYPE_VAR {
  return createTsImportMapProvider(
    TPL_IMPORTS_SCHEMA_VAR,
    TPL_IMPORT_MAP_CREATOR,
  );
}`;
