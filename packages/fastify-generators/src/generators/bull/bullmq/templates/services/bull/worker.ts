// @ts-nocheck

import { Worker, Processor, WorkerOptions } from 'bullmq';
import { logError } from '%error-logger';
import { logger } from '%logger-service';
import { getRedisClient } from '%fastify-redis';

export function createWorker<DataType>(
  queueName: string,
  processor: string | Processor<DataType>,
  options?: WorkerOptions
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
    logger.info(`${job.queueName}: Failed ${job.name} (${err.message})`);
    logError(err);
  });

  return worker;
}
