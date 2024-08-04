import './instrument';
import { buildServer } from './server';
import { config } from './services/config';
import { logError } from './services/error-logger';
import { logger } from './services/logger';

async function startServer(): Promise<void> {
  const fastify = await buildServer({ logger });
  fastify
    .listen({ port: config.SERVER_PORT, host: config.SERVER_HOST })
    .catch((err) => {
      logError(err);
    });
}

startServer().catch((err) => logError(err));
