// @ts-nocheck

import type { AppServices } from '%appRuntimeImports';
import type { FastifyPluginCallback } from 'fastify';

import fp from 'fastify-plugin';

const healthCheckPluginCallback: FastifyPluginCallback<{
  services: AppServices;
}> = (fastify, { services }, done) => {
  fastify.get('/healthz', { logLevel: 'warn' }, TPL_HEALTH_CHECKS);

  done();
};

export const healthCheckPlugin = fp(healthCheckPluginCallback, {
  name: 'health-check',
  encapsulate: true,
});
