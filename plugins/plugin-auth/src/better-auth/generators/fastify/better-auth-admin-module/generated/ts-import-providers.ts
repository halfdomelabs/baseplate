import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_PATHS } from './template-paths.js';

export const betterAuthAdminModuleImportsSchema = createTsImportMapSchema({
  resetUserPassword: {},
  updateUserRoles: {},
});

export type BetterAuthAdminModuleImportsProvider =
  TsImportMapProviderFromSchema<typeof betterAuthAdminModuleImportsSchema>;

export const betterAuthAdminModuleImportsProvider =
  createReadOnlyProviderType<BetterAuthAdminModuleImportsProvider>(
    'better-auth-admin-module-imports',
  );

const betterAuthBetterAuthAdminModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_PATHS.provider,
  },
  exports: {
    betterAuthAdminModuleImports:
      betterAuthAdminModuleImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        betterAuthAdminModuleImports: createTsImportMap(
          betterAuthAdminModuleImportsSchema,
          {
            resetUserPassword: paths.adminAuthService,
            updateUserRoles: paths.adminAuthService,
          },
        ),
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_IMPORTS = {
  task: betterAuthBetterAuthAdminModuleImportsTask,
};
