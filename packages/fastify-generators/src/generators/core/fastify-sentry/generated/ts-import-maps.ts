import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const fastifySentryImportsSchema = createTsImportMapSchema({
  isSentryEnabled: {},
  logErrorToSentry: {},
  registerSentryEventProcessor: {},
  shouldLogToSentry: {},
});

type FastifySentryImportsProvider = TsImportMapProviderFromSchema<
  typeof fastifySentryImportsSchema
>;

export const fastifySentryImportsProvider =
  createReadOnlyProviderType<FastifySentryImportsProvider>(
    'fastify-sentry-imports',
  );

export function createFastifySentryImports(
  importBase: string,
): FastifySentryImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(fastifySentryImportsSchema, {
    isSentryEnabled: path.join(importBase, 'sentry.js'),
    logErrorToSentry: path.join(importBase, 'sentry.js'),
    registerSentryEventProcessor: path.join(importBase, 'sentry.js'),
    shouldLogToSentry: path.join(importBase, 'sentry.js'),
  });
}
