import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const loggerServiceImportsSchema = createTsImportMapSchema({ logger: {} });

type LoggerServiceImportsProvider = TsImportMapProviderFromSchema<
  typeof loggerServiceImportsSchema
>;

export const loggerServiceImportsProvider =
  createReadOnlyProviderType<LoggerServiceImportsProvider>(
    'logger-service-imports',
  );

export function createLoggerServiceImports(
  importBase: string,
): LoggerServiceImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(loggerServiceImportsSchema, {
    logger: path.join(importBase, 'logger.js'),
  });
}
