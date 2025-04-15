import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMapProvider,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
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

  return createTsImportMapProvider(loggerServiceImportsSchema, {
    logger: path.join(importBase, 'logger.js'),
  });
}
