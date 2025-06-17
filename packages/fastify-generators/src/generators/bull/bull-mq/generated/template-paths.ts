import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BullBullMqPaths {
  scriptsRunWorkers: string;
  scriptsSynchronizeRepeatJobs: string;
  serviceIndex: string;
  serviceQueue: string;
  serviceRepeatable: string;
  serviceWorker: string;
}

const bullBullMqPaths =
  createProviderType<BullBullMqPaths>('bull-bull-mq-paths');

const bullBullMqPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { bullBullMqPaths: bullBullMqPaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        bullBullMqPaths: {
          scriptsRunWorkers: `${packageRoot}/scripts/run-workers.ts`,
          scriptsSynchronizeRepeatJobs: `${packageRoot}/scripts/synchronize-repeat-jobs.ts`,
          serviceIndex: `${srcRoot}/services/bull/index.ts`,
          serviceQueue: `${srcRoot}/services/bull/queue.ts`,
          serviceRepeatable: `${srcRoot}/services/bull/repeatable.ts`,
          serviceWorker: `${srcRoot}/services/bull/worker.ts`,
        },
      },
    };
  },
});

export const BULL_BULL_MQ_PATHS = {
  provider: bullBullMqPaths,
  task: bullBullMqPathsTask,
};
