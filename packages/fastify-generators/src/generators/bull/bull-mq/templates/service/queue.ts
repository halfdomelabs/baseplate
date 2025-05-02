// @ts-nocheck

import { logError } from '%errorHandlerServiceImports';
import { getRedisClient } from '%fastifyRedisImports';
import { ConnectionOptions, Queue, QueueOptions } from 'bullmq';

const managedQueues: Record<string, Queue> = {};

export function getOrCreateManagedQueue<DataType>(
  queueName: string,
  options?: Omit<QueueOptions, 'connection'> & {
    connection?: ConnectionOptions;
  },
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

  let connRefusedReported = false;
  queue.on('error', (err) => {
    // If Redis is down, we don't want to spam the logs with errors
    if (err.message.includes('ECONNREFUSED')) {
      if (connRefusedReported) return;
      connRefusedReported = true;
    } else {
      connRefusedReported = false;
    }
    logError(err);
  });

  managedQueues[queueName] = queue;

  return queue;
}
