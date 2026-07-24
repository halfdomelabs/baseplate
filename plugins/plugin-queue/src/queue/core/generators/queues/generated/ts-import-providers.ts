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
  bindQueueHandler: {},
  defineQueue: {},
  EnqueueOptions: { isTypeOnly: true },
  QueueHandlerBinding: { isTypeOnly: true },
  QueueHandlerBindingConfig: { isTypeOnly: true },
  QueueHandlerBindingInput: { isTypeOnly: true },
  QueueInfo: { isTypeOnly: true },
  QueueIntrospection: { isTypeOnly: true },
  QueueJob: { isTypeOnly: true },
  QueueJobHandler: { isTypeOnly: true },
  QueueRuntime: { isTypeOnly: true },
  QueueService: { isTypeOnly: true },
  QueueToken: { isTypeOnly: true },
  QueueWorkers: { isTypeOnly: true },
  RepeatableConfig: { isTypeOnly: true },
  ScheduledJob: { isTypeOnly: true },
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
          bindQueueHandler: paths.queueTypes,
          defineQueue: paths.queueTypes,
          EnqueueOptions: paths.queueTypes,
          QueueHandlerBinding: paths.queueTypes,
          QueueHandlerBindingConfig: paths.queueTypes,
          QueueHandlerBindingInput: paths.queueTypes,
          QueueInfo: paths.queueTypes,
          QueueIntrospection: paths.queueTypes,
          QueueJob: paths.queueTypes,
          QueueJobHandler: paths.queueTypes,
          QueueRuntime: paths.queueTypes,
          QueueService: paths.queueTypes,
          QueueToken: paths.queueTypes,
          QueueWorkers: paths.queueTypes,
          RepeatableConfig: paths.queueTypes,
          ScheduledJob: paths.queueTypes,
        }),
      },
    };
  },
});

export const QUEUE_CORE_QUEUES_IMPORTS = {
  task: queueCoreQueuesImportsTask,
};
