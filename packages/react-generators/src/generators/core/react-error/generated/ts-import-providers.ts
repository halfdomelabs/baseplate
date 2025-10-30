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

import { CORE_REACT_ERROR_PATHS } from './template-paths.js';

export const reactErrorImportsSchema = createTsImportMapSchema({
  formatError: {},
  logAndFormatError: {},
  logError: {},
});

export type ReactErrorImportsProvider = TsImportMapProviderFromSchema<
  typeof reactErrorImportsSchema
>;

export const reactErrorImportsProvider =
  createReadOnlyProviderType<ReactErrorImportsProvider>('react-error-imports');

const coreReactErrorImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_ERROR_PATHS.provider,
  },
  exports: {
    reactErrorImports: reactErrorImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        reactErrorImports: createTsImportMap(reactErrorImportsSchema, {
          formatError: paths.errorFormatter,
          logAndFormatError: paths.errorFormatter,
          logError: paths.errorLogger,
        }),
      },
    };
  },
});

export const CORE_REACT_ERROR_IMPORTS = {
  task: coreReactErrorImportsTask,
};
