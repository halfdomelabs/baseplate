import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { configServiceImportsProvider } from '../../config-service/generated/ts-import-maps.js';
import { errorHandlerServiceImportsProvider } from '../../error-handler-service/generated/ts-import-maps.js';
import { loggerServiceImportsProvider } from '../../logger-service/generated/ts-import-maps.js';

const index = createTsTemplateFile({
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'index',
  projectExports: {},
  source: { path: 'index.ts' },
  variables: { TPL_INITIALIZERS: {} },
});

const server = createTsTemplateFile({
  name: 'server',
  projectExports: {},
  source: { path: 'server.ts' },
  variables: {
    TPL_PLUGINS: {},
    TPL_PRE_PLUGIN_FRAGMENTS: {},
    TPL_ROOT_MODULE: {},
  },
});

export const CORE_FASTIFY_SERVER_TS_TEMPLATES = { index, server };
