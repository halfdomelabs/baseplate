import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const reactSentryImportsSchema = createTsImportMapSchema({
  logBreadcrumbToSentry: {},
  logErrorToSentry: {},
});

type ReactSentryImportsProvider = TsImportMapProviderFromSchema<
  typeof reactSentryImportsSchema
>;

export const reactSentryImportsProvider =
  createReadOnlyProviderType<ReactSentryImportsProvider>(
    'react-sentry-imports',
  );

export function createReactSentryImports(
  importBase: string,
): ReactSentryImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(reactSentryImportsSchema, {
    logBreadcrumbToSentry: path.join(importBase, 'sentry.js'),
    logErrorToSentry: path.join(importBase, 'sentry.js'),
  });
}
