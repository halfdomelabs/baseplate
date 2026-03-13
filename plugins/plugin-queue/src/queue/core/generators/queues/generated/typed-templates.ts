import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const embeddedWorkersPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'embedded-workers-plugin',
  projectExports: { embeddedWorkersPlugin: { isTypeOnly: false } },
  referencedGeneratorTemplates: { workersService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/embedded-workers.plugin.ts',
    ),
  },
  variables: { TPL_IMPLEMENTATION_PLUGIN_NAME: {} },
});

const queueRegistry = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'queue-registry',
  projectExports: { QUEUE_REGISTRY: { isTypeOnly: false } },
  referencedGeneratorTemplates: { queueTypes: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/constants/queues.constants.ts',
    ),
  },
  variables: { TPL_QUEUE_LIST: {} },
});

const queueTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'queue-types',
  projectExports: {
    EnqueueOptions: { isTypeOnly: true },
    Queue: { isTypeOnly: true },
    QueueDefinition: { isTypeOnly: true },
    QueueJob: { isTypeOnly: true },
    RepeatableConfig: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/types/queue.types.ts',
    ),
  },
  variables: {},
});

const workersService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'workers-service',
  projectExports: { startWorkers: { isTypeOnly: false } },
  referencedGeneratorTemplates: { queueRegistry: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/workers.service.ts',
    ),
  },
  variables: {},
});

export const QUEUE_CORE_QUEUES_TEMPLATES = {
  embeddedWorkersPlugin,
  queueRegistry,
  queueTypes,
  workersService,
};
