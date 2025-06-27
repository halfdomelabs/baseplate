import fp from 'fastify-plugin';

import { prisma } from '../services/prisma.js';

export const healthCheckPlugin = fp(
  (fastify, opts, done) => {
    fastify.get('/healthz', { logLevel: 'warn' }, async () => {
      // check Prisma is operating
      await prisma.$queryRaw`SELECT 1;`;
      return { success: true };
    });

    done();
  },
  {
    name: 'health-check',
    encapsulate: true,
  },
);
