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

import { CORE_REACT_UTILS_PATHS } from './template-paths.js';

const reactUtilsImportsSchema = createTsImportMapSchema({
  getSafeLocalStorage: {},
});

export type ReactUtilsImportsProvider = TsImportMapProviderFromSchema<
  typeof reactUtilsImportsSchema
>;

export const reactUtilsImportsProvider =
  createReadOnlyProviderType<ReactUtilsImportsProvider>('react-utils-imports');

const coreReactUtilsImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_UTILS_PATHS.provider,
  },
  exports: {
    reactUtilsImports: reactUtilsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        reactUtilsImports: createTsImportMap(reactUtilsImportsSchema, {
          getSafeLocalStorage: paths.safeLocalStorage,
        }),
      },
    };
  },
});

export const CORE_REACT_UTILS_IMPORTS = {
  task: coreReactUtilsImportsTask,
};
