import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const requestContextImportsSchema = createTsImportMapSchema({
  RequestInfo: { isTypeOnly: true },
});

type RequestContextImportsProvider = TsImportMapProviderFromSchema<
  typeof requestContextImportsSchema
>;

export const requestContextImportsProvider =
  createReadOnlyProviderType<RequestContextImportsProvider>(
    'request-context-imports',
  );

export function createRequestContextImports(
  importBase: string,
): RequestContextImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(requestContextImportsSchema, {
    RequestInfo: path.join(importBase, 'request-context.js'),
  });
}
