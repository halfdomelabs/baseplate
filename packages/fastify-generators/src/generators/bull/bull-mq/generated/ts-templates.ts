import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@baseplate-dev/core-generators';

import { errorHandlerServiceImportsProvider } from '../../../core/error-handler-service/generated/ts-import-maps.js';
import { fastifyRedisImportsProvider } from '../../../core/fastify-redis/generated/ts-import-maps.js';
import { loggerServiceImportsProvider } from '../../../core/logger-service/generated/ts-import-maps.js';

const scriptsRunWorkers = createTsTemplateFile({
  group: 'scripts',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'scripts-run-workers',
  projectExports: {},
  source: { path: 'scripts/run-workers.ts' },
  variables: { TPL_WORKERS: {} },
});

const scriptsSynchronizeRepeatJobs = createTsTemplateFile({
  group: 'scripts',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'scripts-synchronize-repeat-jobs',
  projectExports: {},
  source: { path: 'scripts/synchronize-repeat-jobs.ts' },
  variables: { TPL_REPEAT_JOBS: {} },
});

const scriptsGroup = createTsTemplateGroup({
  templates: {
    scriptsRunWorkers: {
      destination: 'run-workers.ts',
      template: scriptsRunWorkers,
    },
    scriptsSynchronizeRepeatJobs: {
      destination: 'synchronize-repeat-jobs.ts',
      template: scriptsSynchronizeRepeatJobs,
    },
  },
});

const serviceIndex = createTsTemplateFile({
  group: 'service',
  name: 'service-index',
  projectExports: {
    ManagedRepeatableJobConfig: { isTypeOnly: true },
    ManagedRepeatableJobsConfig: { isTypeOnly: true },
    createWorker: {},
    getOrCreateManagedQueue: {},
    synchronizeRepeatableJobs: {},
  },
  source: { path: 'service/index.ts' },
  variables: {},
});

const serviceQueue = createTsTemplateFile({
  group: 'service',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
  },
  name: 'service-queue',
  projectExports: {},
  source: { path: 'service/queue.ts' },
  variables: {},
});

const serviceRepeatable = createTsTemplateFile({
  group: 'service',
  importMapProviders: {
    fastifyRedisImports: fastifyRedisImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'service-repeatable',
  projectExports: {},
  source: { path: 'service/repeatable.ts' },
  variables: {},
});

const serviceWorker = createTsTemplateFile({
  group: 'service',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'service-worker',
  projectExports: {},
  source: { path: 'service/worker.ts' },
  variables: {},
});

const serviceGroup = createTsTemplateGroup({
  templates: {
    serviceIndex: { destination: 'index.ts', template: serviceIndex },
    serviceQueue: { destination: 'queue.ts', template: serviceQueue },
    serviceRepeatable: {
      destination: 'repeatable.ts',
      template: serviceRepeatable,
    },
    serviceWorker: { destination: 'worker.ts', template: serviceWorker },
  },
});

export const BULL_BULL_MQ_TS_TEMPLATES = { scriptsGroup, serviceGroup };
