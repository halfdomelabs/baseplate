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

import { CORE_APP_RUNTIME_PATHS } from './template-paths.js';

export const appRuntimeImportsSchema = createTsImportMapSchema({
  AppRuntime: { isTypeOnly: true },
  createAppRuntime: {},
  RuntimeServices: { isTypeOnly: true },
});

export type AppRuntimeImportsProvider = TsImportMapProviderFromSchema<
  typeof appRuntimeImportsSchema
>;

export const appRuntimeImportsProvider =
  createReadOnlyProviderType<AppRuntimeImportsProvider>('app-runtime-imports');

const coreAppRuntimeImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_APP_RUNTIME_PATHS.provider,
  },
  exports: {
    appRuntimeImports: appRuntimeImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        appRuntimeImports: createTsImportMap(appRuntimeImportsSchema, {
          AppRuntime: paths.appRuntime,
          createAppRuntime: paths.appRuntime,
          RuntimeServices: paths.runtimeServices,
        }),
      },
    };
  },
});

export const CORE_APP_RUNTIME_IMPORTS = {
  task: coreAppRuntimeImportsTask,
};
