import type { FastifyInstance, FastifyServerOptions } from 'fastify';

import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import { nanoid } from 'nanoid';

import { rootModule } from './modules/index.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { gracefulShutdownPlugin } from './plugins/graceful-shutdown.js';
import { graphqlPlugin } from './plugins/graphql/index.js';
import { healthCheckPlugin } from './plugins/health-check.js';
import { pgBossPlugin } from './plugins/pg-boss.plugin.js';
import { requestContextPlugin } from './plugins/request-context.js';
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
  await fastify.register(fastifyCookie);
  await fastify.register(gracefulShutdownPlugin);
  await fastify.register(graphqlPlugin);
  await fastify.register(healthCheckPlugin);
  await fastify.register(pgBossPlugin);
  await fastify.register(requestContextPlugin);
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
