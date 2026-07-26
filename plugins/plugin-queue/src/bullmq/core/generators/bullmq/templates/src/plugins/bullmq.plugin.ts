// @ts-nocheck

import type { AppServices } from '%appRuntimeImports';
import type { FastifyPluginCallback } from 'fastify';

import { config } from '%configServiceImports';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { createSystemServiceContext } from '%serviceContextImports';
import fastifyPlugin from 'fastify-plugin';

/**
 * Fastify plugin that optionally starts BullMQ workers embedded in the API
 * process. Queue construction and disposal are owned by {@link AppRuntime};
 * this plugin only starts workers when embedded mode is enabled.
 */
const bullMQPluginCallback: FastifyPluginCallback<{
  // Not narrowed to `queue`: job handlers run with a full service context.
  services: AppServices;
}> = (fastify, { services }, done) => {
  if (config.ENABLE_EMBEDDED_WORKERS) {
    logger.info(
      { event: 'embedded-workers-enabled' },
      'Embedded workers mode enabled - starting workers in application process',
    );

    fastify.addHook('onReady', async () => {
      try {
        await services.queue.startWorkers({
          createContext: () => createSystemServiceContext(services),
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
