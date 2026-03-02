import fp from 'fastify-plugin';

import { logError } from '../services/error-logger.js';
import { logger } from '../services/logger.js';

const TIMEOUT = 10_000; // time out if shutdown takes longer than 10 seconds

/* eslint-disable unicorn/no-process-exit -- allows for proper graceful shutdowns */

export const gracefulShutdownPlugin = fp((fastify, opts, done) => {
  const shutdownServer: NodeJS.SignalsListener = (signal) => {
    setTimeout(() => {
      logError(new Error('Shutdown timed out'));
      process.exit(1);
    }, TIMEOUT).unref();

    logger.info(`Received ${signal} signal. Shutting down...`);

    fastify
      .close()
      .then(() => process.exit(0))
      .catch((err: unknown) => {
        logError(err);
        process.exit(1);
      });
  };

  process.on('SIGINT', shutdownServer);
  process.on('SIGTERM', shutdownServer);

  done();
});
