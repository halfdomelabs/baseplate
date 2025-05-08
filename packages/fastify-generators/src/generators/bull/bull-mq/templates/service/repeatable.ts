// @ts-nocheck

import type { Queue } from 'bullmq';

import { getRedisClient } from '%fastifyRedisImports';
import { logger } from '%loggerServiceImports';

const DEFAULT_TZ = 'Etc/UTC';

export interface ManagedRepeatableJobConfig<DataType = unknown> {
  name: string;
  data?: DataType;
  pattern?: string;
  every?: number;
  endDate?: Date | number | string;
}

export interface ManagedRepeatableJobsConfig<DataType = unknown> {
  getQueue: () => Queue<DataType>;
  jobs: ManagedRepeatableJobConfig<DataType>[];
}

/**
 * Synchronizes repeatable jobs by updating any jobs that have changed repeat schedules and adding
 * ones that are missing.
 */
export async function synchronizeRepeatableJobs(
  configs: ManagedRepeatableJobsConfig[],
): Promise<void> {
  logger.info(`Synchronizing repeatable jobs...`);

  await Promise.all(
    configs.map(async (config) => {
      const queue = config.getQueue();
      const repeatableJobs = await queue.getRepeatableJobs();

      await Promise.all(
        config.jobs.map(async (job) => {
          const existingJob = repeatableJobs.find(
            (repeatableJob) => repeatableJob.name === job.name,
          );
          const jobHasIdenticalRepeat =
            existingJob &&
            (existingJob?.pattern ?? '') ===
              String(job.pattern ?? job.every ?? '') &&
            (existingJob?.endDate ?? '') ===
              ((job.endDate && new Date(job.endDate).getTime()) ?? '');

          // if job already exists and has identical repeat, do nothing
          if (jobHasIdenticalRepeat) {
            return;
          }

          // if job already exists and has different repeat, remove it
          if (existingJob && !jobHasIdenticalRepeat) {
            logger.info(
              `Removed duplicate repeatable job ${job.name} for queue ${queue.name}`,
            );
            await queue.removeRepeatableByKey(existingJob.key);
          }

          // add job
          await queue.add(job.name, job.data, {
            repeat: {
              tz: DEFAULT_TZ,
              pattern: job.pattern,
              every: job.every,
              endDate: job.endDate,
            },
          });

          logger.info(
            `Added repeatable job ${job.name} for queue ${queue.name}`,
          );
        }),
      );
    }),
  );

  logger.info(`Repeatable jobs synchronized!`);

  // close out Redis connection
  getRedisClient().disconnect();
}
