import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';

const instrument = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'instrument',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/instrument.ts'),
  },
  variables: { TPL_INTEGRATIONS: {} },
});

const sentry = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'sentry',
  projectExports: {
    isSentryEnabled: {},
    logErrorToSentry: {},
    registerSentryEventProcessor: {},
    shouldLogToSentry: {},
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/sentry.ts'),
  },
  variables: { TPL_LOG_TO_SENTRY_CONDITIONS: {}, TPL_SCOPE_CONFIGURATION: {} },
});

export const CORE_FASTIFY_SENTRY_TEMPLATES = { instrument, sentry };
