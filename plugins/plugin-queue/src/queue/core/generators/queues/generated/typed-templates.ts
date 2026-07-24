import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { serviceContextImportsProvider } from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const queueTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'queue-types',
  projectExports: {
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
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/types/queue.types.ts',
    ),
  },
  variables: {},
});

export const QUEUE_CORE_QUEUES_TEMPLATES = { queueTypes };
