import fp from 'fastify-plugin';

import { prisma } from '../services/prisma.js';

export const healthCheckPlugin = fp(
  (fastify, opts, done) => {
    fastify.get(
      '/healthz',
      { logLevel: 'warn' },
      /* TPL_HEALTH_CHECKS:START */ async () => {
        // check Prisma is operating
        await prisma.$queryRaw`SELECT 1;`;
        return { success: true };
      } /* TPL_HEALTH_CHECKS:END */,
    );

    done();
  },
  {
    name: 'health-check',
    encapsulate: true,
  },
);
