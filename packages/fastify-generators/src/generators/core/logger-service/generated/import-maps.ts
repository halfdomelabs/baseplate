import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMapProvider,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';

const loggerServiceImportMapSchema = createTsImportMapSchema({
  logger: {},
});

type LoggerServiceImportMapProvider = TsImportMapProviderFromSchema<
  typeof loggerServiceImportMapSchema
>;

export const loggerServiceImportsProvider =
  createReadOnlyProviderType<LoggerServiceImportMapProvider>(
    'logger-service-imports',
  );

interface LoggerServiceFileMap {
  logger: string;
}

export function createLoggerServiceImportMap(
  filePaths: LoggerServiceFileMap,
): LoggerServiceImportMapProvider {
  return createTsImportMapProvider(loggerServiceImportMapSchema, {
    logger: filePaths.logger,
  });
}
