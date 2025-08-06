import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface QueueCoreQueuesPaths {
  queueRegistry: string;
  queueTypes: string;
}

const queueCoreQueuesPaths = createProviderType<QueueCoreQueuesPaths>(
  'queue-core-queues-paths',
);

const queueCoreQueuesPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { queueCoreQueuesPaths: queueCoreQueuesPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        queueCoreQueuesPaths: {
          queueRegistry: `${srcRoot}/constants/queues.constants.ts`,
          queueTypes: `${srcRoot}/types/queue.types.ts`,
        },
      },
    };
  },
});

export const QUEUE_CORE_QUEUES_PATHS = {
  provider: queueCoreQueuesPaths,
  task: queueCoreQueuesPathsTask,
};
