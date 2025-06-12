import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

const gracefulShutdown = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'graceful-shutdown',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graceful-shutdown.ts',
    ),
  },
  variables: {},
});

export const CORE_FASTIFY_GRACEFUL_SHUTDOWN_TEMPLATES = { gracefulShutdown };
