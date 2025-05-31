import type { FeatureFlag } from '@baseplate-dev/project-builder-lib';
import type { FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import mime from 'mime';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { createContextBuilder } from '#src/api/context.js';
import { appRouter, type AppRouter } from '#src/api/index.js';
import { pathSafeJoin } from '#src/utils/paths.js';

import type { BuilderServiceManager } from './builder-service-manager.js';

export const baseplatePlugin: FastifyPluginAsyncZod<{
  cliVersion: string;
  featureFlags: FeatureFlag[];
  serviceManager: BuilderServiceManager;
  userConfig: BaseplateUserConfig;
  serverPort: number;
}> = async function (
  fastify,
  { cliVersion, featureFlags, serviceManager, userConfig, serverPort },
) {
  fastify.log.info(
    `Loaded projects:\n${serviceManager
      .getServices()
      .map((api) => `${api.directory}: ${api.id}`)
      .join('\n')}`,
  );

  await fastify.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: createContextBuilder({
        serviceManager,
        cliVersion,
        logger: fastify.log,
        featureFlags,
        userConfig,
        serverPort,
      }),
      onError: ({ error }) => {
        fastify.log.error(error);
      },
      // hack since WSS options are not included
      ...({
        keepAlive: {
          enabled: true,
          // server ping message interval in milliseconds
          pingMs: 30_000,
          // connection is terminated if pong message is not received in this many milliseconds
          pongWaitMs: 5000,
        },
      } as Record<string, unknown>),
    },
    useWSS: true,
  } satisfies FastifyTRPCPluginOptions<AppRouter>);

  fastify.get('/api/plugins/:projectId/:pluginId/static/*', {
    schema: {
      params: z.object({
        projectId: z.string().min(1),
        pluginId: z.string().min(1),
        '*': z.string(),
      }),
    },
    handler: async (req, reply) => {
      const { projectId, '*': staticPath } = req.params;
      const service = serviceManager.getService(projectId);
      if (!service) {
        reply.status(404).send('No project with provided ID found');
        return;
      }
      const plugins = await service.getAvailablePlugins();
      const plugin = plugins.find(
        (plugin) => plugin.id === req.params.pluginId,
      );
      if (!plugin) {
        reply.status(404).send('No plugin with provided ID found');
        return;
      }
      const fullPath = pathSafeJoin(
        path.join(plugin.pluginDirectory, 'static'),
        staticPath,
      );
      if (!fullPath || !fs.existsSync(fullPath)) {
        reply.status(404).send('File not found');
        return;
      }
      const stream = fs.createReadStream(fullPath);

      reply.header(
        'Content-Type',
        mime.getType(fullPath) ?? 'application/octet-stream',
      );
      return reply.send(stream);
    },
  });

  // serve remoteEntry.js for plugins
  fastify.get('/api/plugins/:projectId/:pluginId/web/*', {
    schema: {
      params: z.object({
        projectId: z.string().min(1),
        pluginId: z.string().min(1),
        '*': z.string(),
      }),
    },
    handler: async (req, reply) => {
      const { projectId, '*': staticPath } = req.params;
      const service = serviceManager.getService(projectId);
      if (!service) {
        reply.status(404).send('No project with provided ID found');
        return;
      }
      const plugins = await service.getAvailablePlugins();
      const plugin = plugins.find(
        (plugin) => plugin.id === req.params.pluginId,
      );
      if (!plugin) {
        reply.status(404).send('No plugin with provided ID found');
        return;
      }
      const fullPath = pathSafeJoin(plugin.webBuildDirectory, staticPath);
      if (!fullPath || !fs.existsSync(fullPath)) {
        reply.status(404).send('File not found');
        return;
      }
      const stream = fs.createReadStream(fullPath);

      reply.header(
        'Content-Type',
        mime.getType(fullPath) ?? 'application/octet-stream',
      );
      return reply.send(stream);
    },
  });

  fastify.addHook('onClose', () => {
    serviceManager.removeAllServices();
  });
};
