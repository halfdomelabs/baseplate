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

import { PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_PATHS } from './template-paths.js';

export const placeholderAuthModuleImportsSchema = createTsImportMapSchema({
  createPlaceholderUserSessionService: {},
});

export type PlaceholderAuthModuleImportsProvider =
  TsImportMapProviderFromSchema<typeof placeholderAuthModuleImportsSchema>;

export const placeholderAuthModuleImportsProvider =
  createReadOnlyProviderType<PlaceholderAuthModuleImportsProvider>(
    'placeholder-auth-module-imports',
  );

const placeholderAuthCorePlaceholderAuthModuleImportsTask = createGeneratorTask(
  {
    dependencies: {
      paths: PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_PATHS.provider,
    },
    exports: {
      placeholderAuthModuleImports:
        placeholderAuthModuleImportsProvider.export(packageScope),
    },
    run({ paths }) {
      return {
        providers: {
          placeholderAuthModuleImports: createTsImportMap(
            placeholderAuthModuleImportsSchema,
            { createPlaceholderUserSessionService: paths.userSessionService },
          ),
        },
      };
    },
  },
);

export const PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_IMPORTS = {
  task: placeholderAuthCorePlaceholderAuthModuleImportsTask,
};
