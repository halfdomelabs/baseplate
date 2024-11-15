/* eslint-disable unicorn/no-process-exit */
import fp from 'fastify-plugin';

const TIMEOUT = 10_000; // time out if shutdown takes longer than 10 seconds

export const gracefulShutdownPlugin = fp((fastify, opts, done) => {
  const shutdownServer: NodeJS.SignalsListener = (signal) => {
    setTimeout(() => {
      fastify.log.error(new Error('Shutdown timed out'));
      process.exit(1);
    }, TIMEOUT).unref();

    // when using fastify.log instead of console.log, the log message will be
    // sent out after the process has been terminated. this avoids that.

    console.info(`Received ${signal} signal. Shutting down...`);

    fastify
      .close()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        fastify.log.error(error);
        process.exit(1);
      });
  };

  process.on('SIGINT', shutdownServer);
  process.on('SIGTERM', shutdownServer);

  done();
});
