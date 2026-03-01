import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  userSessionServiceImportsProvider,
  userSessionServiceImportsSchema,
} from '@baseplate-dev/fastify-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { BETTER_AUTH_BETTER_AUTH_MODULE_PATHS } from './template-paths.js';

export const betterAuthModuleImportsSchema = createTsImportMapSchema({
  auth: {},
  betterAuthPlugin: {},
  cookiePrefix: {},
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
    userSessionServiceImports:
      userSessionServiceImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        betterAuthModuleImports: createTsImportMap(
          betterAuthModuleImportsSchema,
          {
            auth: paths.auth,
            betterAuthPlugin: paths.betterAuthPlugin,
            cookiePrefix: paths.auth,
            toWebHeaders: paths.headersUtils,
          },
        ),
        userSessionServiceImports: createTsImportMap(
          userSessionServiceImportsSchema,
          { userSessionService: paths.userSessionService },
        ),
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_MODULE_IMPORTS = {
  task: betterAuthBetterAuthModuleImportsTask,
};
