import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import { createTsImportMapSchema } from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export const authorizerUtilsImportsSchema = createTsImportMapSchema({
  checkGlobalAuthorization: {},
  checkInstanceAuthorization: {},
  GlobalRoleCheck: { isTypeOnly: true },
  InstanceRoleCheck: { isTypeOnly: true },
});

export type AuthorizerUtilsImportsProvider = TsImportMapProviderFromSchema<
  typeof authorizerUtilsImportsSchema
>;

export const authorizerUtilsImportsProvider =
  createReadOnlyProviderType<AuthorizerUtilsImportsProvider>(
    'authorizer-utils-imports',
  );
