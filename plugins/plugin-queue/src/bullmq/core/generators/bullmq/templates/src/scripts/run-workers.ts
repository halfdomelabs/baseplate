#!/usr/bin/env node
// @ts-nocheck

import { initializeBullMQ, shutdownBullMQ } from '$bullmqService';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { QUEUE_REGISTRY } from '%queuesImports';

/**
 * Worker script for running BullMQ queue workers.
 * This script:
 * 1. Initializes BullMQ
 * 2. Starts all queue workers
 * 3. Handles graceful shutdown
 */

/**
 * Start all queue workers.
 */
async function startWorkers(): Promise<void> {
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

/**
 * Main entry point for the worker script.
 */
async function main(): Promise<void> {
  logger.info('Starting queue worker process...');

  // Initialize BullMQ
  initializeBullMQ();
  logger.info('BullMQ initialized in worker mode', {
    event: 'bullmq-initialized',
  });

  const activeQueueNames = QUEUE_REGISTRY.map((queue) => queue.name);

  // Get active queue names from registry
  logger.info(
    {
      queues: activeQueueNames,
      count: activeQueueNames.length,
      event: 'active-queues-from-registry',
    },
    'Active queues from registry',
  );

  // Start all workers
  await startWorkers();

  logger.info('Queue worker process started successfully', {
    event: 'queue-worker-process-started',
  });
  logger.info('Workers are now processing jobs. Press Ctrl+C to stop.');
}

/**
 * Handle graceful shutdown.
 */
function shutdown(): void {
  logger.info('Received shutdown signal, stopping workers...');

  shutdownBullMQ()
    .then(() => {
      logger.info('Workers stopped successfully', {
        event: 'workers-stopped',
      });
      process.exit(0);
    })
    .catch((error: unknown) => {
      logError(error, { source: 'run-workers' });
      process.exit(1);
    });
}

// Register shutdown handlers
process.on('SIGTERM', () => {
  shutdown();
});

process.on('SIGINT', () => {
  shutdown();
});

// Start the worker process
main().catch((error: unknown) => {
  logError(error, { source: 'run-workers' });
  process.exit(1);
});
