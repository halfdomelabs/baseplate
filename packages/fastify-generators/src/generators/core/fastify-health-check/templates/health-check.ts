// @ts-nocheck

import type { FastifyPluginAsync } from 'fastify';

export const healthCheckPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/healthz', { logLevel: 'warn' }, TPL_HEALTH_CHECKS);
};
