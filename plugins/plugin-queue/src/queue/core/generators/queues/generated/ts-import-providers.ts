import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { QUEUE_CORE_QUEUES_PATHS } from './template-paths.js';

export const queuesImportsSchema = createTsImportMapSchema({
  embeddedWorkersPlugin: {},
  EnqueueOptions: { isTypeOnly: true },
  Queue: { isTypeOnly: true },
  QUEUE_REGISTRY: {},
  QueueDefinition: { isTypeOnly: true },
  QueueJob: { isTypeOnly: true },
  RepeatableConfig: { isTypeOnly: true },
  startWorkers: {},
});

export type QueuesImportsProvider = TsImportMapProviderFromSchema<
  typeof queuesImportsSchema
>;

export const queuesImportsProvider =
  createReadOnlyProviderType<QueuesImportsProvider>('queues-imports');

const queueCoreQueuesImportsTask = createGeneratorTask({
  dependencies: {
    paths: QUEUE_CORE_QUEUES_PATHS.provider,
  },
  exports: { queuesImports: queuesImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        queuesImports: createTsImportMap(queuesImportsSchema, {
          embeddedWorkersPlugin: paths.embeddedWorkersPlugin,
          EnqueueOptions: paths.queueTypes,
          Queue: paths.queueTypes,
          QUEUE_REGISTRY: paths.queueRegistry,
          QueueDefinition: paths.queueTypes,
          QueueJob: paths.queueTypes,
          RepeatableConfig: paths.queueTypes,
          startWorkers: paths.workersService,
        }),
      },
    };
  },
});

export const QUEUE_CORE_QUEUES_IMPORTS = {
  task: queueCoreQueuesImportsTask,
};
