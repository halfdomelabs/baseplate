import path from 'path';
import fastifyHelmet from '@fastify/helmet';
import fastifyStaticPlugin from '@fastify/static';
import fastifyWebsocketPlugin from '@fastify/websocket';
import { fastify, FastifyInstance } from 'fastify';
import { packageDirectory } from 'pkg-dir';
import { logError } from '@src/services/error-logger.js';
import { logger } from '@src/services/logger.js';
import { resolveModule } from '@src/utils/resolve.js';
import { baseplatePlugin } from './plugin.js';

export async function buildServer(
  directories: string[]
): Promise<FastifyInstance> {
  const server = fastify({ forceCloseConnections: true, logger });

  await server.register(fastifyHelmet);

  try {
    const projectBuilderWebDir = await packageDirectory({
      cwd: resolveModule('@halfdomelabs/project-builder-web/package.json'),
    });

    if (!projectBuilderWebDir) {
      throw new Error(`Unable to find project-builder-web package`);
    }

    await server.register(fastifyStaticPlugin, {
      root: path.join(projectBuilderWebDir, 'dist'),
    });

    server.setNotFoundHandler(async (request, reply) =>
      reply.sendFile('index.html')
    );
  } catch (err) {
    logError(`Unable to find project-builder-web package to host website.`);
    throw err;
  }

  await server.register(fastifyWebsocketPlugin);

  await server.register(baseplatePlugin, { directories });

  return server;
}
