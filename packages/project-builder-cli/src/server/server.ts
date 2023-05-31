import path from 'path';
import fastifyHelmet from '@fastify/helmet';
import fastifyStaticPlugin from '@fastify/static';
import fastifyWebsocketPlugin from '@fastify/websocket';
import Fastify, { FastifyInstance } from 'fastify';
import { sync as resolve } from 'resolve';
import { logError } from '@src/services/error-logger';
import { logger } from '@src/services/logger';
import { baseplatePlugin } from './plugin';

export async function buildServer(
  directories: string[]
): Promise<FastifyInstance> {
  const fastify = Fastify({ forceCloseConnections: true, logger });

  await fastify.register(fastifyHelmet);

  try {
    const projectBuilderWebDir = path.dirname(
      resolve('@halfdomelabs/project-builder-web/package.json')
    );

    await fastify.register(fastifyStaticPlugin, {
      root: path.join(projectBuilderWebDir, 'dist'),
    });
  } catch (err) {
    logError(`Unable to find project-builder-web package to host website.`);
    throw err;
  }

  await fastify.register(fastifyWebsocketPlugin);

  await fastify.register(baseplatePlugin, { directories });

  return fastify;
}
