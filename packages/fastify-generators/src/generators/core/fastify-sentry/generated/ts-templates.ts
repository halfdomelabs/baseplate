import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { configServiceImportsProvider } from '../../config-service/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '../../error-handler-service/generated/ts-import-providers.js';

const instrument = createTsTemplateFile({
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'instrument',
  projectExports: {},
  source: { path: 'instrument.ts' },
  variables: { TPL_INTEGRATIONS: {} },
});

const sentry = createTsTemplateFile({
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
  source: { path: 'services/sentry.ts' },
  variables: { TPL_LOG_TO_SENTRY_CONDITIONS: {}, TPL_SCOPE_CONFIGURATION: {} },
});

export const CORE_FASTIFY_SENTRY_TS_TEMPLATES = { instrument, sentry };
