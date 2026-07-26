import type { FastifyPluginCallback } from 'fastify';

import fp from 'fastify-plugin';

import type { AppServices } from '../utils/runtime-services.js';

import { prisma } from '../services/prisma.js';

const healthCheckPluginCallback: FastifyPluginCallback<{
  /* TPL_SERVICES_FIELD:START */ services /* TPL_SERVICES_FIELD:END */: AppServices;
}> = (
  fastify,
  /* TPL_PLUGIN_PARAMS:START */ { services } /* TPL_PLUGIN_PARAMS:END */,
  done,
) => {
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
