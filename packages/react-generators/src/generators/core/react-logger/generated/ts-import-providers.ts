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

import { CORE_REACT_LOGGER_PATHS } from './template-paths.js';

export const reactLoggerImportsSchema = createTsImportMapSchema({ logger: {} });

export type ReactLoggerImportsProvider = TsImportMapProviderFromSchema<
  typeof reactLoggerImportsSchema
>;

export const reactLoggerImportsProvider =
  createReadOnlyProviderType<ReactLoggerImportsProvider>(
    'react-logger-imports',
  );

const coreReactLoggerImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_LOGGER_PATHS.provider,
  },
  exports: {
    reactLoggerImports: reactLoggerImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        reactLoggerImports: createTsImportMap(reactLoggerImportsSchema, {
          logger: paths.logger,
        }),
      },
    };
  },
});

export const CORE_REACT_LOGGER_IMPORTS = {
  task: coreReactLoggerImportsTask,
};
