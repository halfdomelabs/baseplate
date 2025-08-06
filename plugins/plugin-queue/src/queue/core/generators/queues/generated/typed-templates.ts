import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const queueRegistry = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'queue-registry',
  projectExports: { QUEUE_REGISTRY: {} },
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

export const QUEUE_CORE_QUEUES_TEMPLATES = { queueRegistry, queueTypes };
