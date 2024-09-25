// @ts-nocheck
import { buildServer } from './server.js';

async function startServer(): Promise<void> {
  const fastify = await buildServer(SERVER_OPTIONS);
  fastify.listen({ port: SERVER_PORT, host: SERVER_HOST }).catch((err) => {
    LOG_ERROR(err);
  });
}

startServer().catch((err) => LOG_ERROR(err));
