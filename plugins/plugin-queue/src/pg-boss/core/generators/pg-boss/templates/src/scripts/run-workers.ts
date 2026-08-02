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

  // The dedicated worker process is the one that owns background loops.
  const appRuntime = createAppRuntime({ backgroundServices: true });
  runtime = appRuntime;

  const activeQueueNames = appRuntime.services.queue
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

  await appRuntime.services.queue.startWorkers({
    createContext: () => createSystemServiceContext(appRuntime.services),
  });

  logger.info(
    { event: 'queue-worker-process-started' },
    'Queue worker process started successfully',
  );
  logger.info('Workers are now processing jobs. Press Ctrl+C to stop.');
}

/**
 * Handle graceful shutdown.
 */
function shutdown(): void {
  logger.info('Received shutdown signal, stopping workers...');

  (runtime?.dispose() ?? Promise.resolve())
    .then(() => {
      logger.info({ event: 'workers-stopped' }, 'Workers stopped successfully');
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
