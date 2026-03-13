// @ts-nocheck

import type { FastifyPluginCallback } from 'fastify';

import { startWorkers } from '$workersService';
import { config } from '%configServiceImports';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import fastifyPlugin from 'fastify-plugin';

/**
 * Fastify plugin for embedded workers.
 * Starts queue workers in the same process as the API server when enabled.
 */
const embeddedWorkersPluginCallback: FastifyPluginCallback = (
  fastify,
  _opts,
  done,
): void => {
  if (!config.ENABLE_EMBEDDED_WORKERS) {
    done();
    return;
  }

  logger.info(
    { event: 'embedded-workers-enabled' },
    'Embedded workers mode enabled - starting workers in application process',
  );

  // Start workers after server is ready
  fastify.addHook('onReady', async () => {
    try {
      await startWorkers();
    } catch (error: unknown) {
      logError(error, {
        source: 'embedded-workers-plugin',
        event: 'worker-startup-failed',
      });
      logger.error(
        'Failed to start embedded workers. Server will continue but workers are not running.',
      );
      // Don't throw - allow server to continue running
    }
  });

  done();
};

export const embeddedWorkersPlugin = fastifyPlugin(
  embeddedWorkersPluginCallback,
  {
    name: 'embedded-workers',
    dependencies: [TPL_IMPLEMENTATION_PLUGIN_NAME],
  },
);
