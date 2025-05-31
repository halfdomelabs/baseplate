import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const reactLoggerImportsSchema = createTsImportMapSchema({ logger: {} });

type ReactLoggerImportsProvider = TsImportMapProviderFromSchema<
  typeof reactLoggerImportsSchema
>;

export const reactLoggerImportsProvider =
  createReadOnlyProviderType<ReactLoggerImportsProvider>(
    'react-logger-imports',
  );

export function createReactLoggerImports(
  importBase: string,
): ReactLoggerImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(reactLoggerImportsSchema, {
    logger: path.join(importBase, 'logger.js'),
  });
}
