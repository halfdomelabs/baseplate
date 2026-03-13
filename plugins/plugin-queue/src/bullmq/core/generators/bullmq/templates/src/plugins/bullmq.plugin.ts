// @ts-nocheck

import type { FastifyPluginCallback } from 'fastify';

import { initializeBullMQ, shutdownBullMQ, startWorkers } from '$bullmqService';
import { config } from '%configServiceImports';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { QUEUE_REGISTRY } from '%queuesImports';
import fastifyPlugin from 'fastify-plugin';

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
