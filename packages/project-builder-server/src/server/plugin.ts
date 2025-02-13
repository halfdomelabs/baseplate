import type {
  FeatureFlag,
  PluginMetadataWithPaths,
} from '@halfdomelabs/project-builder-lib';
import type { FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import mime from 'mime';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import { createContextBuilder } from '@src/api/context.js';
import { getCsrfToken } from '@src/api/crsf.js';
import { appRouter, type AppRouter } from '@src/api/index.js';
import { pathSafeJoin } from '@src/utils/paths.js';

import { ProjectBuilderService } from '../service/builder-service.js';

export const baseplatePlugin: FastifyPluginAsyncZod<{
  directories: string[];
  cliVersion: string;
  builtInPlugins: PluginMetadataWithPaths[];
  featureFlags: FeatureFlag[];
}> = async function (
  fastify,
  { directories, cliVersion, builtInPlugins, featureFlags },
) {
  const csrfToken = getCsrfToken();
  const services = await Promise.all(
    directories.map((directory) => {
      const id = crypto
        .createHash('shake256', { outputLength: 9 })
        .update(directory)
        .digest('base64')
        .replace('/', '-')
        .replace('+', '_');
      const service = new ProjectBuilderService({
        directory,
        id,
        cliVersion,
        builtInPlugins,
      });
      service.init();
      return service;
    }),
  );

  fastify.log.info(
    `Loaded projects:\n${services
      .map((api) => `${api.directory}: ${api.id}`)
      .join('\n')}`,
  );

  await fastify.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    useWSS: true,
    trpcOptions: {
      router: appRouter,
      createContext: createContextBuilder({
        services,
        cliVersion,
        logger: fastify.log,
        featureFlags,
      }),
      onError: ({ error }) => {
        fastify.log.error(error);
      },
    },
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
      const service = services.find((service) => service.id === projectId);
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
      const service = services.find((service) => service.id === projectId);
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

  fastify.get('/api/auth', {
    schema: {
      response: {
        200: z.object({
          csrfToken: z.string(),
        }),
      },
    },
    handler: (req, res) => {
      // DNS rebinding attack prevention
      const host = req.headers.host ?? '';
      if (
        !host.startsWith('localhost:') &&
        host !== 'localhost' &&
        !host.startsWith('127.0.0.1:') &&
        host !== '127.0.0.1'
      ) {
        throw new Error(`Must connect from localhost`);
      }
      res.send({ csrfToken });
    },
  });

  fastify.addHook('onClose', () => {
    services.map((service) => {
      service.close();
    });
  });
};
