// @ts-nocheck

import fp from 'fastify-plugin';

export const healthCheckPlugin = fp(
  (fastify, opts, done) => {
    fastify.get('/healthz', { logLevel: 'warn' }, TPL_HEALTH_CHECKS);

    done();
  },
  {
    name: 'health-check',
    encapsulate: true,
  },
);
