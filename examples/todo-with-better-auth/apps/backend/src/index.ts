import { buildServer } from './server.js';
import { config } from './services/config.js';
import { logError } from './services/error-logger.js';
import { logger } from './services/logger.js';
import { createAppRuntime } from './utils/app-runtime.js';

async function startServer(): Promise<void> {
  const runtime = createAppRuntime(/* TPL_RUNTIME_OPTIONS:INLINE */);
  const fastify = await buildServer({
    loggerInstance: logger,
    runtime,
  }).catch(async (err: unknown) => {
    await runtime.dispose();
    throw err;
  });

  try {
    await fastify.listen({
      port: config.SERVER_PORT,
      host: config.SERVER_HOST,
    });
  } catch (err: unknown) {
    // fastify.close() triggers the onClose hook, which disposes the runtime.
    await fastify.close();
    throw err;
  }
}

startServer().catch(
  (err: unknown) =>
    /* TPL_LOG_ERROR:START */ logError(err) /* TPL_LOG_ERROR:END */,
);
