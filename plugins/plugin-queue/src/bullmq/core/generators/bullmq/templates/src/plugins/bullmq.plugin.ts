// @ts-nocheck

import type { FastifyPluginCallback } from 'fastify';

import { initializeBullMQ, shutdownBullMQ } from '$bullmqService';
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

  done();
};

export const bullMQPlugin = fastifyPlugin(bullMQPluginCallback, {
  name: 'bullmq',
});
