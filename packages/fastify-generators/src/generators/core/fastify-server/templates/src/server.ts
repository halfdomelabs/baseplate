// @ts-nocheck

import type { AppRuntime } from '%appRuntimeImports';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';

import { flattenAppModule } from '%appModuleSetupImports';
import Fastify from 'fastify';
import { nanoid } from 'nanoid';

export async function buildServer(
  options: FastifyServerOptions & { runtime: AppRuntime },
): Promise<FastifyInstance> {
  const { runtime, ...fastifyOptions } = options;
  const fastify = Fastify({
    genReqId: () => nanoid(),
    forceCloseConnections: 'idle',
    // it is possible to spoof the IP address of the client but it's better than nothing
    // There's no notion of trusted IPs or hops since we use a rewrite rule for FE
    trustProxy: true,
    ...fastifyOptions,
  });

  fastify.addHook('onClose', async () => {
    await runtime.dispose();
  });

  TPL_PRE_PLUGIN_FRAGMENTS;

  TPL_PLUGINS;

  // register app plugins
  const { plugins = [] } = flattenAppModule(TPL_ROOT_MODULE);
  for (const plugin of plugins) {
    await fastify.register(plugin);
  }

  return fastify;
}
