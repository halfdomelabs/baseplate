import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { errorHandlerServiceImportsProvider } from '../../error-handler-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '../../logger-service/generated/ts-import-providers.js';

const gracefulShutdown = createTsTemplateFile({
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'graceful-shutdown',
  projectExports: {},
  source: { path: 'graceful-shutdown.ts' },
  variables: {},
});

export const CORE_FASTIFY_GRACEFUL_SHUTDOWN_TS_TEMPLATES = { gracefulShutdown };
