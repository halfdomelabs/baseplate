import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { CORE_APP_MODULE_SETUP_PATHS } from './template-paths.js';

const appModuleSetupImportsSchema = createTsImportMapSchema({
  flattenAppModule: {},
});

export type AppModuleSetupImportsProvider = TsImportMapProviderFromSchema<
  typeof appModuleSetupImportsSchema
>;

export const appModuleSetupImportsProvider =
  createReadOnlyProviderType<AppModuleSetupImportsProvider>(
    'app-module-setup-imports',
  );

const coreAppModuleSetupImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_APP_MODULE_SETUP_PATHS.provider,
  },
  exports: {
    appModuleSetupImports: appModuleSetupImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        appModuleSetupImports: createTsImportMap(appModuleSetupImportsSchema, {
          flattenAppModule: paths.appModules,
        }),
      },
    };
  },
});

export const CORE_APP_MODULE_SETUP_IMPORTS = {
  task: coreAppModuleSetupImportsTask,
};
