// @ts-nocheck

import type { FastifyPluginAsync } from 'fastify';

import { initializePgBoss, shutdownPgBoss, startWorkers } from '$pgBossService';
import { config } from '%configServiceImports';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { QUEUE_REGISTRY } from '%queuesImports';
import fastifyPlugin from 'fastify-plugin';

/**
 * Fastify plugin for pg-boss queue system initialization.
 */
const pgBossPluginCallback: FastifyPluginAsync = async (fastify) => {
  // Initialize pg-boss - disable maintenance when workers run separately
  await initializePgBoss({
    disableMaintenance: !config.ENABLE_EMBEDDED_WORKERS,
  });

  // Handle graceful shutdown
  fastify.addHook('onClose', async () => {
    await shutdownPgBoss();
  });

  if (config.ENABLE_EMBEDDED_WORKERS) {
    logger.info(
      { event: 'embedded-workers-enabled' },
      'Embedded workers mode enabled - starting workers in application process',
    );

    fastify.addHook('onReady', async () => {
      try {
        await startWorkers(QUEUE_REGISTRY);
      } catch (error: unknown) {
        logError(error, {
          source: 'pg-boss-plugin',
          event: 'embedded-worker-startup-failed',
        });
        logger.error(
          'Failed to start embedded workers. Server will continue but workers are not running.',
        );
      }
    });
  }
};

export const pgBossPlugin = fastifyPlugin(pgBossPluginCallback, {
  name: 'pg-boss',
});
