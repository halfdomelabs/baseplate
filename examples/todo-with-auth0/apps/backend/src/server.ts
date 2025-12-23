import type { FastifyInstance, FastifyServerOptions } from 'fastify';

import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import fastifyAuth0Verify from 'fastify-auth0-verify';
import rawBodyPlugin from 'fastify-raw-body';
import { nanoid } from 'nanoid';

import { rootModule } from './modules/index.js';
import { bullmqPlugin } from './plugins/bullmq.plugin.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { gracefulShutdownPlugin } from './plugins/graceful-shutdown.js';
import { graphqlPlugin } from './plugins/graphql/index.js';
import { healthCheckPlugin } from './plugins/health-check.js';
import { requestContextPlugin } from './plugins/request-context.js';
import { stripeWebhookPlugin } from './plugins/stripe-webhook.js';
import { config } from './services/config.js';
import { registerSentryEventProcessor } from './services/sentry.js';

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

  /* TPL_PRE_PLUGIN_FRAGMENTS:START */
  Sentry.setupFastifyErrorHandler(fastify);
  registerSentryEventProcessor();
  /* TPL_PRE_PLUGIN_FRAGMENTS:END */

  /* TPL_PLUGINS:START */
  await fastify.register(errorHandlerPlugin);
  await fastify.register(helmet);
  await fastify.register(bullmqPlugin);
  await fastify.register(fastifyCookie);
  await fastify.register(fastifyAuth0Verify, {
    domain: config.AUTH0_DOMAIN,
    audience: config.AUTH0_AUDIENCE,
  });
  await fastify.register(gracefulShutdownPlugin);
  await fastify.register(graphqlPlugin);
  await fastify.register(healthCheckPlugin);
  await fastify.register(rawBodyPlugin);
  await fastify.register(requestContextPlugin);
  await fastify.register(stripeWebhookPlugin);
  /* TPL_PLUGINS:END */

  // register app plugins
  const plugins =
    /* TPL_ROOT_MODULE:START */ rootModule /* TPL_ROOT_MODULE:END */.plugins ??
    [];
  for (const plugin of plugins) {
    await fastify.register(plugin);
  }

  return fastify;
}
