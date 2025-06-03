import type { FeatureFlag } from '@baseplate-dev/project-builder-lib';
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

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import type { BuilderServiceManager } from './builder-service-manager.js';

import { gracefulShutdownPlugin } from './graceful-shutdown.js';
import { baseplatePlugin } from './plugin.js';

export interface WebServerOptions {
  projectBuilderStaticDir?: string;
  cliVersion: string;
  logger: Logger;
  featureFlags: FeatureFlag[];
  serviceManager: BuilderServiceManager;
  userConfig: BaseplateUserConfig;
  port: number;
}

export async function buildServer({
  projectBuilderStaticDir,
  cliVersion,
  logger,
  featureFlags,
  serviceManager,
  userConfig,
  port,
}: WebServerOptions): Promise<FastifyInstance> {
  const server = fastify({
    forceCloseConnections: 'idle',
    loggerInstance: logger as FastifyBaseLogger,
    maxParamLength: 10_000,
  });

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  await server.register(gracefulShutdownPlugin);

  await server.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        // Disable upgrade-insecure-requests to allow insecure requests to localhost
        // This is required for Safari to work (https://github.com/helmetjs/helmet/issues/429)
        upgradeInsecureRequests: null,
      },
    },
  });

  await server.register(fastifyWebsocketPlugin);

  await server.register(baseplatePlugin, {
    cliVersion,
    featureFlags,
    serviceManager,
    userConfig,
    serverPort: port,
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
