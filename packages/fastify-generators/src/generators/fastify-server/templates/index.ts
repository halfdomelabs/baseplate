// @ts-nocheck
import { buildServer } from './server';

async function startServer(): Promise<void> {
  const fastify = await buildServer(SERVER_OPTIONS);
  fastify.listen(SERVER_PORT, SERVER_HOST).catch((err) => {
    LOG_ERROR(err);
  });
}

startServer().catch((err) => LOG_ERROR(err));
