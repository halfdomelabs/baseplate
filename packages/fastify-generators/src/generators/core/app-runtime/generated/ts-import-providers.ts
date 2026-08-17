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
  AppServices: { isTypeOnly: true },
  createAppRuntime: {},
  InternalServices: { isTypeOnly: true },
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
          AppServices: paths.runtimeServices,
          createAppRuntime: paths.appRuntime,
          InternalServices: paths.runtimeServices,
          RuntimeServices: paths.runtimeServices,
        }),
      },
    };
  },
});

export const CORE_APP_RUNTIME_IMPORTS = {
  generatorName: '@baseplate-dev/fastify-generators#core/app-runtime',
  task: coreAppRuntimeImportsTask,
};
