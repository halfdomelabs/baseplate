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

import { CORE_REACT_ROUTER_PATHS } from './template-paths.js';

const reactRouterImportsSchema = createTsImportMapSchema({
  AppRoutes: {},
  router: {},
});

export type ReactRouterImportsProvider = TsImportMapProviderFromSchema<
  typeof reactRouterImportsSchema
>;

export const reactRouterImportsProvider =
  createReadOnlyProviderType<ReactRouterImportsProvider>(
    'react-router-imports',
  );

const coreReactRouterImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_ROUTER_PATHS.provider,
  },
  exports: {
    reactRouterImports: reactRouterImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        reactRouterImports: createTsImportMap(reactRouterImportsSchema, {
          AppRoutes: paths.appRoutes,
          router: paths.appRoutes,
        }),
      },
    };
  },
});

export const CORE_REACT_ROUTER_IMPORTS = {
  task: coreReactRouterImportsTask,
};
