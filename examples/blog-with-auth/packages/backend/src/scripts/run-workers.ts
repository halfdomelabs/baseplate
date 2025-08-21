#!/usr/bin/env node

import { QUEUE_REGISTRY } from '../constants/queues.constants.js';
import { logError } from '../services/error-logger.js';
import { logger } from '../services/logger.js';
import {
  cleanupOrphanedSchedules,
  initializePgBoss,
  shutdownPgBoss,
} from '../services/pg-boss.service.js';

/**
 * Worker script for running pg-boss queue workers.
 * This script:
 * 1. Initializes pg-boss
 * 2. Syncs scheduled jobs based on the queue registry
 * 3. Cleans up orphaned schedules
 * 4. Starts all queue workers
 * 5. Handles graceful shutdown
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

  // Initialize pg-boss
  await initializePgBoss();
  logger.info('pg-boss initialized in worker mode', {
    event: 'pg-boss-initialized',
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

  // Cleanup orphaned schedules (from removed queues)
  await cleanupOrphanedSchedules(activeQueueNames);

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

  shutdownPgBoss()
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
