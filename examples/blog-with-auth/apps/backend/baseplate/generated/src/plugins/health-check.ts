import type { FastifyPluginCallback } from 'fastify';

import fp from 'fastify-plugin';

import type { AppRuntime } from '../utils/app-runtime.js';

import { prisma } from '../services/prisma.js';

const healthCheckPluginCallback: FastifyPluginCallback<{
  runtime: AppRuntime;
}> = (fastify, opts, done) => {
  fastify.get(
    '/healthz',
    { logLevel: 'warn' },
    /* TPL_HEALTH_CHECKS:START */ async () => {
      // check Prisma is operating
      await prisma.$queryRaw`SELECT 1;`;

      // check Redis is operating
      await opts.runtime.redis.healthCheck();
      return { success: true };
    } /* TPL_HEALTH_CHECKS:END */,
  );

  done();
};

export const healthCheckPlugin = fp(healthCheckPluginCallback, {
  name: 'health-check',
  encapsulate: true,
});
