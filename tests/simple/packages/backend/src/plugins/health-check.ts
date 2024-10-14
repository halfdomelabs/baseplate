import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../services/prisma.js';

export const healthCheckPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/healthz', { logLevel: 'warn' }, async () => {
    // check Prisma is operating
    await prisma.$queryRaw`SELECT 1;`;

    return { success: true };
  });
};
