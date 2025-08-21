import type { FastifyPluginAsync } from 'fastify';

import fastifyPlugin from 'fastify-plugin';

import {
  initializePgBoss,
  shutdownPgBoss,
} from '../services/pg-boss.service.js';

/**
 * Fastify plugin for pg-boss queue system initialization.
 */
const pgBossPlugin: FastifyPluginAsync = async (fastify) => {
  // Initialize pg-boss in API mode (maintenance disabled)
  await initializePgBoss({ disableMaintenance: true });

  // Handle graceful shutdown
  fastify.addHook('onClose', async () => {
    await shutdownPgBoss();
  });
};

export default fastifyPlugin(pgBossPlugin, {
  name: 'pg-boss',
});
