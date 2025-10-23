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
      logError(err);
    });
}

startServer().catch((err: unknown) => logError(err));
