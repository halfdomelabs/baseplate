import fp from 'fastify-plugin';

const TIMEOUT = 10000; // time out if shutdown takes longer than 10 seconds

export const gracefulShutdownPlugin = fp(async (fastify) => {
  const shutdownServer: NodeJS.SignalsListener = async (signal) => {
    try {
      setTimeout(() => {
        LOG_ERROR(new Error('Shutdown timed out'));
        process.exit(1);
      }, TIMEOUT).unref();

      LOGGER(`Received ${signal} signal. Shutting down...`);

      await fastify.close();
      process.exit(0);
    } catch (err) {
      LOG_ERROR(err);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdownServer);
  process.on('SIGTERM', shutdownServer);
});
