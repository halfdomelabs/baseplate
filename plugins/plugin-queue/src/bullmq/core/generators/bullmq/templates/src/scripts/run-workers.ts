#!/usr/bin/env node
// @ts-nocheck

import type { AppRuntime } from '%appRuntimeImports';

import { createAppRuntime } from '%appRuntimeImports';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { createSystemServiceContext } from '%serviceContextImports';

/**
 * Worker script for running queue workers standalone (outside the API
 * process). Constructs its own {@link AppRuntime} and disposes it on
 * shutdown, mirroring how `buildServer` manages the runtime for the API.
 */

let runtime: AppRuntime | undefined;

/**
 * Main entry point for the worker script.
 */
async function main(): Promise<void> {
  logger.info('Starting queue worker process...');

  const appRuntime = createAppRuntime();
  runtime = appRuntime;

  const activeQueueNames = appRuntime.queues
    .listQueues()
    .map((queue) => queue.name);

  logger.info(
    {
      queues: activeQueueNames,
      count: activeQueueNames.length,
      event: 'active-queues-from-registry',
    },
    'Active queues from registry',
  );

  await appRuntime.queues.startWorkers({
    createContext: () => createSystemServiceContext(appRuntime),
  });

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

  (runtime?.dispose() ?? Promise.resolve())
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
