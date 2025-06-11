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

import { CORE_LOGGER_SERVICE_PATHS } from './template-paths.js';

const loggerServiceImportsSchema = createTsImportMapSchema({ logger: {} });

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
    imports: loggerServiceImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        imports: createTsImportMap(loggerServiceImportsSchema, {
          logger: paths.logger,
        }),
      },
    };
  },
});

export const CORE_LOGGER_SERVICE_IMPORTS = {
  task: coreLoggerServiceImportsTask,
};
