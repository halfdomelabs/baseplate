import type { FastifyPluginCallback } from 'fastify';

import fp from 'fastify-plugin';

import type { AppServices } from '../utils/runtime-services.js';

import { prisma } from '../services/prisma.js';

const healthCheckPluginCallback: FastifyPluginCallback<{
  services: AppServices;
}> = (fastify, { services }, done) => {
  fastify.get(
    '/healthz',
    { logLevel: 'warn' },
    /* TPL_HEALTH_CHECKS:START */ async () => {
      // check Prisma is operating
      await prisma.$queryRaw`SELECT 1;`;

      // check Redis is operating
      await services.redis.healthCheck();
      return { success: true };
    } /* TPL_HEALTH_CHECKS:END */,
  );

  done();
};

export const healthCheckPlugin = fp(healthCheckPluginCallback, {
  name: 'health-check',
  encapsulate: true,
});
