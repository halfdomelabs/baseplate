// @ts-nocheck

import { buildServer } from '$server';
import { createAppRuntime } from '%appRuntimeImports';
import { config } from '%configServiceImports';
import { logger } from '%loggerServiceImports';

async function startServer(): Promise<void> {
  const runtime = await createAppRuntime();
  try {
    const fastify = await buildServer({
      loggerInstance: logger,
      runtime,
    });
    await fastify.listen({
      port: config.SERVER_PORT,
      host: config.SERVER_HOST,
    });
  } catch (err: unknown) {
    await runtime.dispose();
    throw err;
  }
}

startServer().catch((err: unknown) => TPL_LOG_ERROR);
