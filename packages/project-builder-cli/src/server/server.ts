import path from 'path';
import fastifyHelmet from '@fastify/helmet';
import fastifyStaticPlugin from '@fastify/static';
import fastifyWebsocketPlugin from '@fastify/websocket';
import { fastify, FastifyInstance } from 'fastify';
import { sync as resolve } from 'resolve';
import { logError } from '@src/services/error-logger.js';
import { logger } from '@src/services/logger.js';
import { baseplatePlugin } from './plugin.js';

export async function buildServer(
  directories: string[]
): Promise<FastifyInstance> {
  const server = fastify({ forceCloseConnections: true, logger });

  await server.register(fastifyHelmet);

  try {
    const projectBuilderWebDir = path.dirname(
      resolve('@halfdomelabs/project-builder-web/package.json')
    );

    await server.register(fastifyStaticPlugin, {
      root: path.join(projectBuilderWebDir, 'dist'),
    });
  } catch (err) {
    logError(`Unable to find project-builder-web package to host website.`);
    throw err;
  }

  await server.register(fastifyWebsocketPlugin);

  await server.register(baseplatePlugin, { directories });

  return server;
}
