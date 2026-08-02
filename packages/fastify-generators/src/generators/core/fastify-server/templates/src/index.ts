// @ts-nocheck

import { buildServer } from '$server';
import { createAppRuntime } from '%appRuntimeImports';
import { getConfig } from '%configServiceImports';
import { logger } from '%loggerServiceImports';

async function startServer(): Promise<void> {
  const runtime = createAppRuntime(TPL_RUNTIME_OPTIONS);
  const fastify = await buildServer({
    loggerInstance: logger,
    runtime,
  }).catch(async (err: unknown) => {
    await runtime.dispose();
    throw err;
  });

  try {
    await fastify.listen({
      port: getConfig().SERVER_PORT,
      host: getConfig().SERVER_HOST,
    });
  } catch (err: unknown) {
    // fastify.close() triggers the onClose hook, which disposes the runtime.
    await fastify.close();
    throw err;
  }
}

startServer().catch((err: unknown) => TPL_LOG_ERROR);
