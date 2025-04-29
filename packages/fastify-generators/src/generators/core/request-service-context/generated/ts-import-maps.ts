import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const requestServiceContextImportsSchema = createTsImportMapSchema({
  createContextFromRequest: {},
  RequestServiceContext: { isTypeOnly: true },
});

type RequestServiceContextImportsProvider = TsImportMapProviderFromSchema<
  typeof requestServiceContextImportsSchema
>;

export const requestServiceContextImportsProvider =
  createReadOnlyProviderType<RequestServiceContextImportsProvider>(
    'request-service-context-imports',
  );

export function createRequestServiceContextImports(
  importBase: string,
): RequestServiceContextImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(requestServiceContextImportsSchema, {
    createContextFromRequest: path.join(
      importBase,
      'request-service-context.js',
    ),
    RequestServiceContext: path.join(importBase, 'request-service-context.js'),
  });
}
