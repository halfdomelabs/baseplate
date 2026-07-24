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

import { BETTER_AUTH_BETTER_AUTH_MODULE_PATHS } from './template-paths.js';

export const betterAuthModuleImportsSchema = createTsImportMapSchema({
  Auth: { isTypeOnly: true },
  AuthServiceDeps: { isTypeOnly: true },
  betterAuthPlugin: {},
  buildAuth: {},
  cookiePrefix: {},
  createBetterAuthUserSessionService: {},
  toWebHeaders: {},
});

export type BetterAuthModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof betterAuthModuleImportsSchema
>;

export const betterAuthModuleImportsProvider =
  createReadOnlyProviderType<BetterAuthModuleImportsProvider>(
    'better-auth-module-imports',
  );

const betterAuthBetterAuthModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: BETTER_AUTH_BETTER_AUTH_MODULE_PATHS.provider,
  },
  exports: {
    betterAuthModuleImports:
      betterAuthModuleImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        betterAuthModuleImports: createTsImportMap(
          betterAuthModuleImportsSchema,
          {
            Auth: paths.auth,
            AuthServiceDeps: paths.auth,
            betterAuthPlugin: paths.betterAuthPlugin,
            buildAuth: paths.auth,
            cookiePrefix: paths.auth,
            createBetterAuthUserSessionService: paths.userSessionService,
            toWebHeaders: paths.headersUtils,
          },
        ),
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_MODULE_IMPORTS = {
  task: betterAuthBetterAuthModuleImportsTask,
};
