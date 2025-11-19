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

import { CORE_LOGGER_SERVICE_PATHS } from './template-paths.js';

export const loggerServiceImportsSchema = createTsImportMapSchema({
  logger: {},
});

export type LoggerServiceImportsProvider = TsImportMapProviderFromSchema<
  typeof loggerServiceImportsSchema
>;

export const loggerServiceImportsProvider =
  createReadOnlyProviderType<LoggerServiceImportsProvider>(
    'logger-service-imports',
  );

const coreLoggerServiceImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_LOGGER_SERVICE_PATHS.provider,
  },
  exports: {
    loggerServiceImports: loggerServiceImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        loggerServiceImports: createTsImportMap(loggerServiceImportsSchema, {
          logger: paths.logger,
        }),
      },
    };
  },
});

export const CORE_LOGGER_SERVICE_IMPORTS = {
  task: coreLoggerServiceImportsTask,
};
