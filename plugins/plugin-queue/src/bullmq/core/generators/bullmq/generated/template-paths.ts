import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BullmqCoreBullmqPaths {
  bullmqPlugin: string;
  bullmqService: string;
  runWorkers: string;
}

const bullmqCoreBullmqPaths = createProviderType<BullmqCoreBullmqPaths>(
  'bullmq-core-bullmq-paths',
);

const bullmqCoreBullmqPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { bullmqCoreBullmqPaths: bullmqCoreBullmqPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        bullmqCoreBullmqPaths: {
          bullmqPlugin: `${srcRoot}/plugins/bullmq.plugin.ts`,
          bullmqService: `${srcRoot}/services/bullmq.service.ts`,
          runWorkers: `${srcRoot}/scripts/run-workers.ts`,
        },
      },
    };
  },
});

export const BULLMQ_CORE_BULLMQ_PATHS = {
  provider: bullmqCoreBullmqPaths,
  task: bullmqCoreBullmqPathsTask,
};
