// @ts-nocheck
import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { nanoid } from 'nanoid';

export async function buildServer(
  options: FastifyServerOptions = {},
): Promise<FastifyInstance> {
  const fastify = Fastify({
    genReqId: () => nanoid(),
    forceCloseConnections: 'idle',
    // it is possible to spoof the IP address of the client but it's better than nothing
    // There's no notion of trusted IPs or hops since we use a rewrite rule for FE
    trustProxy: true,
    ...options,
  });

  PLUGINS;

  // register app plugins
  const plugins = ROOT_MODULE.plugins ?? [];
  await plugins.reduce(
    (promise, plugin) => promise.then(() => fastify.register(plugin)),
    Promise.resolve(),
  );

  return fastify;
}
