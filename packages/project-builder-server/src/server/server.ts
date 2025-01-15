import type {
  FeatureFlag,
  PluginMetadataWithPaths,
} from '@halfdomelabs/project-builder-lib';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { Logger } from 'pino';

import fastifyHelmet from '@fastify/helmet';
import fastifyStaticPlugin from '@fastify/static';
import fastifyWebsocketPlugin from '@fastify/websocket';
import { fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { gracefulShutdownPlugin } from './graceful-shutdown.js';
import { baseplatePlugin } from './plugin.js';

export interface WebServerOptions {
  directories: string[];
  projectBuilderStaticDir?: string;
  cliVersion: string;
  logger: Logger;
  builtInPlugins: PluginMetadataWithPaths[];
  featureFlags: FeatureFlag[];
}

export async function buildServer({
  directories,
  projectBuilderStaticDir,
  cliVersion,
  logger,
  builtInPlugins,
  featureFlags,
}: WebServerOptions): Promise<FastifyInstance> {
  const server = fastify({
    forceCloseConnections: 'idle',
    loggerInstance: logger as FastifyBaseLogger,
    maxParamLength: 10_000,
  });

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  await server.register(gracefulShutdownPlugin);

  await server.register(fastifyHelmet);

  await server.register(fastifyWebsocketPlugin);

  await server.register(baseplatePlugin, {
    directories,
    cliVersion,
    builtInPlugins,
    featureFlags,
  });

  if (projectBuilderStaticDir) {
    await server.register(fastifyStaticPlugin, {
      root: projectBuilderStaticDir,
    });

    server.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/trpc') || request.url.startsWith('/api')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return server;
}
