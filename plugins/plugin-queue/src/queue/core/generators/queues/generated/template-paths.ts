import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface QueueCoreQueuesPaths {
  embeddedWorkersPlugin: string;
  queueRegistry: string;
  queueTypes: string;
  workersService: string;
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
          embeddedWorkersPlugin: `${srcRoot}/plugins/embedded-workers.plugin.ts`,
          queueRegistry: `${srcRoot}/constants/queues.constants.ts`,
          queueTypes: `${srcRoot}/types/queue.types.ts`,
          workersService: `${srcRoot}/services/workers.service.ts`,
        },
      },
    };
  },
});

export const QUEUE_CORE_QUEUES_PATHS = {
  provider: queueCoreQueuesPaths,
  task: queueCoreQueuesPathsTask,
};
