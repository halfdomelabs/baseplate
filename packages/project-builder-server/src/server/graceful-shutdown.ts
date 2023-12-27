import fp from 'fastify-plugin';

const TIMEOUT = 10000; // time out if shutdown takes longer than 10 seconds

export const gracefulShutdownPlugin = fp((fastify, opts, done) => {
  const shutdownServer: NodeJS.SignalsListener = (signal) => {
    setTimeout(() => {
      fastify.log.error(new Error('Shutdown timed out'));
      process.exit(1);
    }, TIMEOUT).unref();

    fastify.log.info(`Received ${signal} signal. Shutting down...`);

    fastify
      .close()
      .then(() => process.exit(0))
      .catch((err) => {
        fastify.log.error(err);
        process.exit(1);
      });
  };

  process.on('SIGINT', shutdownServer);
  process.on('SIGTERM', shutdownServer);

  done();
});
