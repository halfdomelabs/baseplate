// @ts-nocheck

import { config } from '%configServiceImports';
import { logger } from '%loggerServiceImports';

import { buildServer } from './server.js';

async function startServer(): Promise<void> {
  const fastify = await buildServer({
    loggerInstance: logger,
  });
  fastify
    .listen({ port: config.SERVER_PORT, host: config.SERVER_HOST })
    .catch((err: unknown) => {
      TPL_LOG_ERROR;
    });
}

startServer().catch((err: unknown) => TPL_LOG_ERROR);
