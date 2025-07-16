import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

const index = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'index',
  referencedGeneratorTemplates: { server: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/index.ts'),
  },
  variables: { TPL_LOG_ERROR: {} },
});

const server = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'server',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/server.ts'),
  },
  variables: {
    TPL_PLUGINS: {},
    TPL_PRE_PLUGIN_FRAGMENTS: {},
    TPL_ROOT_MODULE: {},
  },
});

export const CORE_FASTIFY_SERVER_TEMPLATES = { index, server };
