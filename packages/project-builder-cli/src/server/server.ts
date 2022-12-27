import path from 'path';
import fastifyHelmet from '@fastify/helmet';
import fastifyStaticPlugin from '@fastify/static';
import fastifyWebsocketPlugin from '@fastify/websocket';
import Fastify, { FastifyInstance } from 'fastify';
import { logger } from '@src/services/logger';
import { baseplatePlugin } from './plugin';

export async function buildServer(
  directories: string[]
): Promise<FastifyInstance> {
  const fastify = Fastify({ forceCloseConnections: true, logger });

  await fastify.register(fastifyHelmet);

  await fastify.register(fastifyStaticPlugin, {
    root: path.join(__dirname, '../../../project-builder-web/build'),
  });

  await fastify.register(fastifyWebsocketPlugin);

  await fastify.register(baseplatePlugin, { directories });

  return fastify;
}
