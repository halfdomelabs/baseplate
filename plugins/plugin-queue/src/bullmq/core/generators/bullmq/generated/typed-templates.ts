import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  fastifyRedisImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { queuesImportsProvider } from '#src/queue/core/generators/queues/generated/ts-import-providers.js';

const bullmqPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'bullmq-plugin',
  referencedGeneratorTemplates: { bullmqService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/bullmq.plugin.ts',
    ),
  },
  variables: {},
});

const bullmqService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    queuesImports: queuesImportsProvider,
  },
  name: 'bullmq-service',
  projectExports: {
    createQueue: { isTypeOnly: false },
    getScheduledJobs: { isTypeOnly: false },
    initializeBullMQ: { isTypeOnly: false },
    shutdownBullMQ: { isTypeOnly: false },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/bullmq.service.ts',
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
  referencedGeneratorTemplates: { bullmqService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/package/scripts/run-workers.ts',
    ),
  },
  variables: {},
});

export const mainGroup = { bullmqPlugin, bullmqService, runWorkers };

export const BULLMQ_CORE_BULLMQ_TEMPLATES = { mainGroup };
