import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  appRuntimeImportsProvider,
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  fastifyRedisImportsProvider,
  loggerServiceImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { queuesImportsProvider } from '#src/queue/core/generators/queues/generated/ts-import-providers.js';

const bullmqPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    appRuntimeImports: appRuntimeImportsProvider,
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
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
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'bullmq-service',
  projectExports: { createQueueRuntime: { isTypeOnly: false } },
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
    appRuntimeImports: appRuntimeImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'run-workers',
  referencedGeneratorTemplates: { bullmqService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/scripts/run-workers.ts',
    ),
  },
  variables: {},
});

export const mainGroup = { bullmqPlugin, bullmqService, runWorkers };

export const BULLMQ_CORE_BULLMQ_TEMPLATES = { mainGroup };
