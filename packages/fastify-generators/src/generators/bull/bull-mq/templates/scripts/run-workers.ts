// @ts-nocheck

import type { Worker } from 'bullmq';

import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';

type WorkerCreator = () => Worker;

const WORKER_CREATORS: WorkerCreator[] = TPL_WORKERS;

function handleError(err: unknown): void {
  logError(err);
  process.exit(1);
}

const TIMEOUT = 10_000; // time out if shutdown takes longer than 10 seconds

try {
  const workers = WORKER_CREATORS.map((creator) => creator());

  Promise.all(workers.map((worker) => worker.waitUntilReady()))
    .then(() => {
      logger.info(`Workers initialized for ${workers.length} queue(s)!`);
    })
    .catch(handleError);

  const shutdownWorkers: NodeJS.SignalsListener = (signal): void => {
    setTimeout(() => {
      logError(new Error('Shutdown timed out'));
      process.exit(1);
    }, TIMEOUT).unref();

    logger.info(`Received ${signal} signal. Shutting down...`);

    Promise.all(workers.map((worker) => worker.close()))
      .then(() => process.exit(0))
      .catch((err) => {
        handleError(err);
      });
  };

  process.on('SIGINT', shutdownWorkers);
  process.on('SIGTERM', shutdownWorkers);
} catch (err) {
  handleError(err);
}
