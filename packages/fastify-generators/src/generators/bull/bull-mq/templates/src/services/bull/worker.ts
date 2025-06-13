// @ts-nocheck

import type { ConnectionOptions, Processor, WorkerOptions } from 'bullmq';

import { logError } from '%errorHandlerServiceImports';
import { getRedisClient } from '%fastifyRedisImports';
import { logger } from '%loggerServiceImports';
import { Worker } from 'bullmq';

export function createWorker<DataType>(
  queueName: string,
  processor: string | Processor<DataType>,
  options?: Omit<WorkerOptions, 'connection'> & {
    connection?: ConnectionOptions;
  },
): Worker<DataType> {
  const worker = new Worker(queueName, processor, {
    connection: getRedisClient(),
    ...options,
  });

  worker.on('active', (job) => {
    logger.info(`${job.queueName}: Starting ${job.name}...`);
  });

  worker.on('completed', (job) => {
    logger.info(`${job.queueName}: Completed ${job.name}`);
  });

  worker.on('failed', (job, err) => {
    if (job) {
      logger.info(`${job.queueName}: Failed ${job.name} (${err.message})`);
    }
    logError(err);
  });

  return worker;
}
