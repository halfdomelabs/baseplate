import type { FastifyPluginCallback } from 'fastify';

import fastifyPlugin from 'fastify-plugin';

import type { AppRuntime } from '../utils/app-runtime.js';

import { config } from '../services/config.js';
import { logError } from '../services/error-logger.js';
import { logger } from '../services/logger.js';
import { createSystemServiceContext } from '../utils/service-context.js';

/**
 * Fastify plugin that optionally starts BullMQ workers embedded in the API
 * process. Queue construction and disposal are owned by {@link AppRuntime};
 * this plugin only starts workers when embedded mode is enabled.
 */
const bullMQPluginCallback: FastifyPluginCallback<{
  runtime: AppRuntime;
}> = (fastify, opts, done) => {
  if (config.ENABLE_EMBEDDED_WORKERS) {
    logger.info(
      { event: 'embedded-workers-enabled' },
      'Embedded workers mode enabled - starting workers in application process',
    );

    fastify.addHook('onReady', async () => {
      try {
        await opts.runtime.queues.startWorkers({
          createContext: () => createSystemServiceContext(opts.runtime),
        });
      } catch (error: unknown) {
        logError(error, {
          source: 'bullmq-plugin',
          event: 'embedded-worker-startup-failed',
        });
        logger.error(
          'Failed to start embedded workers. Server will continue but workers are not running.',
        );
      }
    });
  }

  done();
};

export const bullMQPlugin = fastifyPlugin(bullMQPluginCallback, {
  name: 'bullmq',
});
