import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
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
