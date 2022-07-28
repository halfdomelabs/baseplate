// @ts-nocheck
import { FastifyPluginAsync } from 'fastify';

export const healthCheckPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/healthz', { logLevel: 'warn' }, CHECK);
};
