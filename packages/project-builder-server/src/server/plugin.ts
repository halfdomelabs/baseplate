import {
  FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from '@trpc/server/adapters/fastify';
import crypto from 'crypto';
import { FastifyInstance } from 'fastify';

import { ProjectBuilderService } from '../service/builder-service.js';
import { createContext } from '@src/api/context.js';
import { getCsrfToken } from '@src/api/crsf.js';
import { AppRouter, createAppRouter } from '@src/api/index.js';
import {
  GeneratorEngineSetupConfig,
  getGeneratorEngine,
} from '@src/sync/index.js';

export async function baseplatePlugin(
  fastify: FastifyInstance,
  {
    directories,
    cliVersion,
    generatorSetupConfig,
  }: {
    directories: string[];
    cliVersion: string;
    generatorSetupConfig: GeneratorEngineSetupConfig;
  },
): Promise<void> {
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
      }),
      createContext,
      onError: ({ error }) => {
        fastify.log.error(error);
      },
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>);

  fastify.get('/api/auth', (req) => {
    // DNS rebinding attack prevention
    const host = req.headers.host ?? '';
    if (
      !host.startsWith('localhost:') &&
      host !== 'localhost' &&
      !host.startsWith('127.0.0.1') &&
      host !== '127.0.0.1'
    ) {
      throw new Error(`Must connect from localhost`);
    }
    return { csrfToken };
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
}
