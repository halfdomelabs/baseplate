import {
  FeatureFlag,
  PluginConfigWithModule,
} from '@halfdomelabs/project-builder-lib';
import {
  FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from '@trpc/server/adapters/fastify';
import crypto from 'crypto';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import fs from 'fs';
import mime from 'mime';
import path from 'node:path';
import { z } from 'zod';

import { ProjectBuilderService } from '../service/builder-service.js';
import { createContext } from '@src/api/context.js';
import { getCsrfToken } from '@src/api/crsf.js';
import { AppRouter, createAppRouter } from '@src/api/index.js';
import {
  GeneratorEngineSetupConfig,
  getGeneratorEngine,
} from '@src/sync/index.js';

/* eslint-disable @typescript-eslint/no-floating-promises */
// FastifyReply has a then method but it's not a promise
// https://github.com/typescript-eslint/typescript-eslint/issues/2640

export const baseplatePlugin: FastifyPluginAsyncZod<{
  directories: string[];
  cliVersion: string;
  generatorSetupConfig: GeneratorEngineSetupConfig;
  preinstalledPlugins: PluginConfigWithModule[];
  featureFlags: FeatureFlag[];
}> = async function (
  fastify,
  {
    directories,
    cliVersion,
    generatorSetupConfig,
    preinstalledPlugins,
    featureFlags,
  },
) {
  const csrfToken = getCsrfToken();
  const services = await Promise.all(
    directories.map(async (directory) => {
      const id = crypto
        .createHash('shake256', { outputLength: 9 })
        .update(directory)
        .digest('base64')
        .replace('/', '-')
        .replace('+', '_');
      const service = new ProjectBuilderService({
        directory,
        id,
        generatorSetupConfig,
        cliVersion,
        preinstalledPlugins,
      });
      await service.init();
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
      router: createAppRouter({
        services,
        cliVersion,
        logger: fastify.log,
        featureFlags,
      }),
      createContext,
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
      const fullPath = path.join(plugin.pluginDirectory, 'static', staticPath);
      if (!fs.existsSync(fullPath)) {
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
    services.map((service) => service.close());
  });

  // pre-warm up generator engine so syncing is faster on first request
  setTimeout(() => {
    getGeneratorEngine(generatorSetupConfig).catch((err) =>
      fastify.log.error(err),
    );
  }, 500);
};
