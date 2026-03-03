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

import { BETTER_AUTH_REACT_BETTER_AUTH_PATHS } from './template-paths.js';

export const betterAuthImportsSchema = createTsImportMapSchema({
  authClient: {},
  AuthLoadedGate: {},
});

export type BetterAuthImportsProvider = TsImportMapProviderFromSchema<
  typeof betterAuthImportsSchema
>;

export const betterAuthImportsProvider =
  createReadOnlyProviderType<BetterAuthImportsProvider>('better-auth-imports');

const betterAuthReactBetterAuthImportsTask = createGeneratorTask({
  dependencies: {
    paths: BETTER_AUTH_REACT_BETTER_AUTH_PATHS.provider,
  },
  exports: {
    betterAuthImports: betterAuthImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        betterAuthImports: createTsImportMap(betterAuthImportsSchema, {
          authClient: paths.authClient,
          AuthLoadedGate: paths.authLoadedGate,
        }),
      },
    };
  },
});

export const BETTER_AUTH_REACT_BETTER_AUTH_IMPORTS = {
  task: betterAuthReactBetterAuthImportsTask,
};
