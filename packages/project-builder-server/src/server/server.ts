import fastifyHelmet from '@fastify/helmet';
import fastifyStaticPlugin from '@fastify/static';
import fastifyWebsocketPlugin from '@fastify/websocket';
import {
  FeatureFlag,
  PluginConfigWithModule,
} from '@halfdomelabs/project-builder-lib';
import { FastifyBaseLogger, FastifyInstance, fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { Logger } from 'pino';

import { gracefulShutdownPlugin } from './graceful-shutdown.js';
import { baseplatePlugin } from './plugin.js';
import { GeneratorEngineSetupConfig } from '@src/index.js';
import { expandPathWithTilde } from '@src/utils/path.js';

export interface WebServerOptions {
  directories: string[];
  projectBuilderStaticDir?: string;
  cliVersion: string;
  logger: Logger;
  generatorSetupConfig: GeneratorEngineSetupConfig;
  preinstalledPlugins: PluginConfigWithModule[];
  featureFlags: FeatureFlag[];
}

export async function buildServer({
  directories,
  projectBuilderStaticDir,
  cliVersion,
  logger,
  generatorSetupConfig,
  preinstalledPlugins,
  featureFlags,
}: WebServerOptions): Promise<FastifyInstance> {
  const server = fastify({
    forceCloseConnections: 'idle',
    // https://github.com/fastify/fastify/issues/4960
    logger: logger as FastifyBaseLogger,
    maxParamLength: 10000,
  });

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  const resolvedDirectories = directories.map((directory) =>
    expandPathWithTilde(directory),
  );

  await server.register(gracefulShutdownPlugin);

  await server.register(fastifyHelmet);

  await server.register(fastifyWebsocketPlugin);

  await server.register(baseplatePlugin, {
    directories: resolvedDirectories,
    cliVersion,
    generatorSetupConfig,
    preinstalledPlugins,
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
