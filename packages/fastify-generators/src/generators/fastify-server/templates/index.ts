import { buildServer } from './server';

async function startServer(): Promise<void> {
  const fastify = await buildServer({ logger: LOGGER });
  fastify.listen(SERVER_PORT, SERVER_HOST).catch((err) => {
    LOGGER.error(err);
  });
}

startServer().catch((err) => LOGGER.error(err));
