import type { FastifyPluginCallback } from 'fastify';

import fastifyPlugin from 'fastify-plugin';

import { config } from '../services/config.js';
import { logError } from '../services/error-logger.js';
import { logger } from '../services/logger.js';
import { startWorkers } from '../services/workers.service.js';

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
    dependencies: [
      /* TPL_IMPLEMENTATION_PLUGIN_NAME:START */ 'pg-boss' /* TPL_IMPLEMENTATION_PLUGIN_NAME:END */,
    ],
  },
);
