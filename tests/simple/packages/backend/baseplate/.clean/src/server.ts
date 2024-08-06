import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import * as Sentry from '@sentry/node';
import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { nanoid } from 'nanoid';
import { RootModule } from './modules';
import { errorHandlerPlugin } from './plugins/error-handler';
import { gracefulShutdownPlugin } from './plugins/graceful-shutdown';
import { graphqlPlugin } from './plugins/graphql';
import { healthCheckPlugin } from './plugins/health-check';
import { requestContextPlugin } from './plugins/request-context';
import { registerSentryEventProcessor } from './services/sentry';

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

  Sentry.setupFastifyErrorHandler(fastify);
  registerSentryEventProcessor();

  await fastify.register(helmet, {
    // disable to enable Altair to function (alright since we're a backend service)
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
  await fastify.register(errorHandlerPlugin);
  await fastify.register(healthCheckPlugin);
  await fastify.register(requestContextPlugin);
  await fastify.register(gracefulShutdownPlugin);
  await fastify.register(fastifyCookie);
  await fastify.register(graphqlPlugin);

  // register app plugins
  const plugins = RootModule.plugins ?? [];
  await plugins.reduce(
    (promise, plugin) => promise.then(() => fastify.register(plugin)),
    Promise.resolve(),
  );

  return fastify;
}
