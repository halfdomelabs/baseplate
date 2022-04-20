// @ts-nocheck
import fp from 'fastify-plugin';
import { logError } from '%error-logger';
import { logger } from '%logger-service';

const TIMEOUT = 10000; // time out if shutdown takes longer than 10 seconds

export const gracefulShutdownPlugin = fp(async (fastify) => {
  const shutdownServer: NodeJS.SignalsListener = async (signal) => {
    try {
      setTimeout(() => {
        logError(new Error('Shutdown timed out'));
        process.exit(1);
      }, TIMEOUT).unref();

      logger.info(`Received ${signal} signal. Shutting down...`);

      await fastify.close();
      process.exit(0);
    } catch (err) {
      logError(err);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdownServer);
  process.on('SIGTERM', shutdownServer);
});
