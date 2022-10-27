// @ts-nocheck

import { Queue, QueueOptions } from 'bullmq';
import { logError } from '%error-logger';
import { getRedisClient } from '%fastify-redis';

const managedQueues: Record<string, Queue> = {};

export function getOrCreateManagedQueue<DataType>(
  queueName: string,
  options?: QueueOptions
): Queue<DataType> {
  if (managedQueues[queueName]) {
    return managedQueues[queueName] as Queue<DataType>;
  }
  const queue = new Queue<DataType>(queueName, {
    connection: getRedisClient(),
    ...options,
    defaultJobOptions: {
      // keep last 100 jobs before removing them
      removeOnComplete: { count: 100 },
      ...options?.defaultJobOptions,
    },
  });

  queue.on('error', (err) => {
    logError(err);
  });

  managedQueues[queueName] = queue;

  return queue;
}
