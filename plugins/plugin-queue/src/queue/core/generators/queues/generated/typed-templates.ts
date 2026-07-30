import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  appRuntimeImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const queueTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    appRuntimeImports: appRuntimeImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'queue-types',
  projectExports: {
    bindQueueHandler: {},
    DEFAULT_QUEUE_CONCURRENCY: {},
    defineQueue: {},
    EnqueueOptions: { isTypeOnly: true },
    QueueHandlerBinding: { isTypeOnly: true },
    QueueHandlerBindingConfig: { isTypeOnly: true },
    QueueHandlerBindingInput: { isTypeOnly: true },
    QueueInfo: { isTypeOnly: true },
    QueueIntrospection: { isTypeOnly: true },
    QueueJob: { isTypeOnly: true },
    QueueJobHandler: { isTypeOnly: true },
    QueuePolicyFixPlan: { isTypeOnly: true },
    QueuePolicyFixResult: { isTypeOnly: true },
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
