// @ts-nocheck

import type { AppRuntime } from '%appRuntimeImports';
import type { FastifyPluginCallback } from 'fastify';

import fp from 'fastify-plugin';

const healthCheckPluginCallback: FastifyPluginCallback<{
  runtime: AppRuntime;
}> = (fastify, opts, done) => {
  fastify.get('/healthz', { logLevel: 'warn' }, TPL_HEALTH_CHECKS);

  done();
};

export const healthCheckPlugin = fp(healthCheckPluginCallback, {
  name: 'health-check',
  encapsulate: true,
});
