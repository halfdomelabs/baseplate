import type { FastifyPluginAsync } from 'fastify';

import fastifyPlugin from 'fastify-plugin';

import { QUEUE_REGISTRY } from '../constants/queues.constants.js';
import { config } from '../services/config.js';
import { logError } from '../services/error-logger.js';
import { logger } from '../services/logger.js';
import {
  initializePgBoss,
  shutdownPgBoss,
  startWorkers,
} from '../services/pg-boss.service.js';

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
