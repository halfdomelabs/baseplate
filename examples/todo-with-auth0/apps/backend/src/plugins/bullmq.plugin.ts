import type { FastifyPluginCallback } from 'fastify';

import fastifyPlugin from 'fastify-plugin';

import {
  initializeBullMQ,
  shutdownBullMQ,
} from '@src/services/bullmq.service.js';

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

  done();
};

export const bullMQPlugin = fastifyPlugin(bullMQPluginCallback, {
  name: 'bullmq',
});
