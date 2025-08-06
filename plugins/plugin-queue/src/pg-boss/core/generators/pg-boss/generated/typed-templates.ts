import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { queuesImportsProvider } from '#src/queue/core/generators/queues/generated/ts-import-providers.js';

const pgBossPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'pg-boss-plugin',
  projectExports: {},
  referencedGeneratorTemplates: { pgBossService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/pg-boss.plugin.ts',
    ),
  },
  variables: {},
});

const pgBossService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    queuesImports: queuesImportsProvider,
  },
  name: 'pg-boss-service',
  projectExports: { createQueue: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/pg-boss.service.ts',
    ),
  },
  variables: { TPL_DELETE_AFTER_DAYS: {} },
});

const runWorkers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    queuesImports: queuesImportsProvider,
  },
  name: 'run-workers',
  projectExports: {},
  referencedGeneratorTemplates: { pgBossService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/scripts/run-workers.ts',
    ),
  },
  variables: {},
});

export const mainGroup = { pgBossPlugin, pgBossService, runWorkers };

export const PG_BOSS_CORE_PG_BOSS_TEMPLATES = { mainGroup };
