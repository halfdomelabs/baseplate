import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

const scriptsRunWorkers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'scripts',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'scripts-run-workers',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/package/scripts/run-workers.ts',
    ),
  },
  variables: { TPL_WORKERS: {} },
});

const scriptsSynchronizeRepeatJobs = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'scripts',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'scripts-synchronize-repeat-jobs',
  referencedGeneratorTemplates: { serviceIndex: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/package/scripts/synchronize-repeat-jobs.ts',
    ),
  },
  variables: { TPL_REPEAT_JOBS: {} },
});

export const scriptsGroup = { scriptsRunWorkers, scriptsSynchronizeRepeatJobs };

const serviceIndex = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'service',
  importMapProviders: {},
  name: 'service-index',
  projectExports: {
    createWorker: {},
    getOrCreateManagedQueue: {},
    ManagedRepeatableJobConfig: { isTypeOnly: true },
    ManagedRepeatableJobsConfig: { isTypeOnly: true },
    synchronizeRepeatableJobs: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/bull/index.ts',
    ),
  },
  variables: {},
});

const serviceQueue = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'service',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
  },
  name: 'service-queue',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/bull/queue.ts',
    ),
  },
  variables: {},
});

const serviceRepeatable = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'service',
  importMapProviders: {
    fastifyRedisImports: fastifyRedisImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'service-repeatable',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/bull/repeatable.ts',
    ),
  },
  variables: {},
});

const serviceWorker = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'service',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'service-worker',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/bull/worker.ts',
    ),
  },
  variables: {},
});

export const serviceGroup = {
  serviceIndex,
  serviceQueue,
  serviceRepeatable,
  serviceWorker,
};

export const BULL_BULL_MQ_TEMPLATES = { scriptsGroup, serviceGroup };
