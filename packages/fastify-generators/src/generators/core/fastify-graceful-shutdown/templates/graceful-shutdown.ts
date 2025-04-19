// @ts-nocheck

import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import fp from 'fastify-plugin';

const TIMEOUT = 10000; // time out if shutdown takes longer than 10 seconds

export const gracefulShutdownPlugin = fp(async (fastify) => {
  const shutdownServer: NodeJS.SignalsListener = (signal) => {
    setTimeout(() => {
      logError(new Error('Shutdown timed out'));
      process.exit(1);
    }, TIMEOUT).unref();

    logger.info(`Received ${signal} signal. Shutting down...`);

    fastify
      .close()
      .then(() => process.exit(0))
      .catch((err) => {
        logError(err);
        process.exit(1);
      });
  };

  process.on('SIGINT', shutdownServer);
  process.on('SIGTERM', shutdownServer);
});
