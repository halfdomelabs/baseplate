import type { FastifyPluginCallback } from 'fastify';

import fastifyPlugin from 'fastify-plugin';

import { QUEUE_REGISTRY } from '../constants/queues.constants.js';
import {
  initializeBullMQ,
  shutdownBullMQ,
  startWorkers,
} from '../services/bullmq.service.js';
import { config } from '../services/config.js';
import { logError } from '../services/error-logger.js';
import { logger } from '../services/logger.js';

/**
 * Fastify plugin for BullMQ queue system initialization.
 */
const bullMQPluginCallback: FastifyPluginCallback = (fastify, _opts, done) => {
  // Initialize BullMQ
  initializeBullMQ();

  // Handle graceful shutdown
  fastify.addHook('onClose', async () => {
    await shutdownBullMQ();
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
