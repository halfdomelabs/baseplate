import fp from 'fastify-plugin';

const TIMEOUT = 10000; // time out if shutdown takes longer than 10 seconds

export const gracefulShutdownPlugin = fp((fastify, opts, done) => {
  const shutdownServer: NodeJS.SignalsListener = (signal) => {
    setTimeout(() => {
      fastify.log.error(new Error('Shutdown timed out'));
      process.exit(1);
    }, TIMEOUT).unref();

    // when using fastify.log instead of console.log, the log message will be
    // sent out after the process has been terminated. this avoids that.

    // eslint-disable-next-line no-console
    console.info(`Received ${signal} signal. Shutting down...`);

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
