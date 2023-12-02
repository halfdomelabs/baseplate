import fastifyHelmet from '@fastify/helmet';
import fastifyStaticPlugin from '@fastify/static';
import fastifyWebsocketPlugin from '@fastify/websocket';
import { FastifyBaseLogger, FastifyInstance, fastify } from 'fastify';
import { Logger } from 'pino';

import { baseplatePlugin } from './plugin.js';
import { GeneratorEngineSetupConfig } from '@src/index.js';
import { expandPathWithTilde } from '@src/utils/path.js';

export interface WebServerOptions {
  directories: string[];
  projectBuilderStaticDir?: string;
  cliVersion: string;
  logger: Logger;
  generatorSetupConfig: GeneratorEngineSetupConfig;
}

export async function buildServer({
  directories,
  projectBuilderStaticDir,
  cliVersion,
  logger,
  generatorSetupConfig,
}: WebServerOptions): Promise<FastifyInstance> {
  const server = fastify({
    forceCloseConnections: 'idle',
    // https://github.com/fastify/fastify/issues/4960
    logger: logger as FastifyBaseLogger,
    maxParamLength: 10000,
  });
  const resolvedDirectories = directories.map((directory) =>
    expandPathWithTilde(directory),
  );

  await server.register(fastifyHelmet);

  await server.register(fastifyWebsocketPlugin);

  await server.register(baseplatePlugin, {
    directories: resolvedDirectories,
    cliVersion,
    generatorSetupConfig,
  });

  if (projectBuilderStaticDir) {
    await server.register(fastifyStaticPlugin, {
      root: projectBuilderStaticDir,
    });

    server.setNotFoundHandler(async (request, reply) =>
      reply.sendFile('index.html'),
    );
  }

  return server;
}
