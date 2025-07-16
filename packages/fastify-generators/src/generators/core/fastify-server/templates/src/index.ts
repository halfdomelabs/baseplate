// @ts-nocheck

import { buildServer } from '$server';
import { config } from '%configServiceImports';
import { logger } from '%loggerServiceImports';

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
