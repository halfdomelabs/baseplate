import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { nanoid } from 'nanoid';

export async function buildServer(
  options: FastifyServerOptions = {}
): Promise<FastifyInstance> {
  const fastify = Fastify({
    genReqId: () => nanoid(),
    // possible trust proxy here?
    ...options,
  });

  PLUGINS;

  // register app plugins
  const plugins = ROOT_MODULE.plugins || [];
  await plugins.reduce(
    (promise, plugin) => promise.then(() => fastify.register(plugin)),
    Promise.resolve()
  );

  return fastify;
}
