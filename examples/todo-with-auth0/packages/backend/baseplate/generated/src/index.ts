/* HOISTED:sentry-instrument:START */
import './instrument.js';
/* HOISTED:sentry-instrument:END */

import { buildServer } from './server.js';
import { config } from './services/config.js';
import { logError } from './services/error-logger.js';
import { logger } from './services/logger.js';

async function startServer(): Promise<void> {
  const fastify = await buildServer({
    loggerInstance: logger,
  });
  fastify
    .listen({ port: config.SERVER_PORT, host: config.SERVER_HOST })
    .catch((err: unknown) => {
      /* TPL_LOG_ERROR:START */
      logError(err);
      /* TPL_LOG_ERROR:END */
    });
}

startServer().catch(
  (err: unknown) =>
    /* TPL_LOG_ERROR:START */ logError(err) /* TPL_LOG_ERROR:END */,
);
