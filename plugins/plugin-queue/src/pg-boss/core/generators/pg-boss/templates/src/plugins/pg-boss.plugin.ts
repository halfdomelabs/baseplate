// @ts-nocheck

import type { FastifyPluginAsync } from 'fastify';

import { initializePgBoss, shutdownPgBoss } from '$pgBossService';
import fastifyPlugin from 'fastify-plugin';

/**
 * Fastify plugin for pg-boss queue system initialization.
 */
const pgBossPluginCallback: FastifyPluginAsync = async (fastify) => {
  // Initialize pg-boss in API mode (maintenance disabled)
  await initializePgBoss({ disableMaintenance: true });

  // Handle graceful shutdown
  fastify.addHook('onClose', async () => {
    await shutdownPgBoss();
  });
};

export const pgBossPlugin = fastifyPlugin(pgBossPluginCallback, {
  name: 'pg-boss',
});
