import type { FastifyInstance, FastifyServerOptions } from 'fastify';

import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import rawBodyPlugin from 'fastify-raw-body';
import { nanoid } from 'nanoid';

import type { AppRuntime } from './utils/app-runtime.js';

import { rootModule } from './modules/index.js';
import { bullMQPlugin } from './plugins/bullmq.plugin.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { gracefulShutdownPlugin } from './plugins/graceful-shutdown.js';
import { graphqlPlugin } from './plugins/graphql/index.js';
import { healthCheckPlugin } from './plugins/health-check.js';
import { requestContextPlugin } from './plugins/request-context.js';
import { stripeWebhookPlugin } from './plugins/stripe-webhook.js';
import { registerSentryEventProcessor } from './services/sentry.js';
import { flattenAppModule } from './utils/app-modules.js';

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

  /* TPL_PRE_PLUGIN_FRAGMENTS:START */
  Sentry.setupFastifyErrorHandler(fastify);
  registerSentryEventProcessor();
  /* TPL_PRE_PLUGIN_FRAGMENTS:END */

  /* TPL_PLUGINS:START */
  await fastify.register(errorHandlerPlugin);
  await fastify.register(helmet);
  await fastify.register(requestContextPlugin, { runtime });
  await fastify.register(bullMQPlugin, { runtime });
  await fastify.register(fastifyCookie);
  await fastify.register(gracefulShutdownPlugin);
  await fastify.register(graphqlPlugin);
  await fastify.register(healthCheckPlugin);
  await fastify.register(rawBodyPlugin);
  await fastify.register(stripeWebhookPlugin);
  /* TPL_PLUGINS:END */

  // register app plugins
  const { plugins = [] } = flattenAppModule(
    /* TPL_ROOT_MODULE:START */ rootModule /* TPL_ROOT_MODULE:END */,
  );
  for (const plugin of plugins) {
    await fastify.register(plugin, { runtime });
  }

  return fastify;
}
