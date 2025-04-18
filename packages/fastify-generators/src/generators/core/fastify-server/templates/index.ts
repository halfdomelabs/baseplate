// @ts-nocheck

import { config } from '%configServiceImports';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';

import { buildServer } from './server.js';

TPL_INITIALIZERS;

async function startServer(): Promise<void> {
  const fastify = await buildServer({
    loggerInstance: logger,
  });
  fastify
    .listen({ port: config.SERVER_PORT, host: config.SERVER_HOST })
    .catch((err) => {
      logError(err);
    });
}

startServer().catch((err) => logError(err));
