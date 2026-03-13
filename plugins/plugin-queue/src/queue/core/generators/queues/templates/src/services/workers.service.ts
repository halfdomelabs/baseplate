// @ts-nocheck

import { QUEUE_REGISTRY } from '$queueRegistry';
import { logError } from '%errorHandlerServiceImports';

/**
 * Start all queue workers from the registry.
 */
export async function startWorkers(): Promise<void> {
  // Start workers for all registered queues
  const startPromises = QUEUE_REGISTRY.map(async (queue) => {
    try {
      await queue.work();
    } catch (error: unknown) {
      logError(error, { source: 'run-workers', queueName: queue.name });
    }
  });

  await Promise.all(startPromises);
}
