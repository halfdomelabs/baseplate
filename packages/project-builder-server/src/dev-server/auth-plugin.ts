import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import fastifyPlugin from 'fastify-plugin';

import type { DevServerConfig } from './get-or-create-config.js';

const devServerAuthPluginCallback: FastifyPluginCallbackZod<DevServerConfig> =
  function (fastify, { port, token }, done) {
    // Add authentication hook for all routes
    fastify.addHook('onRequest', async (request, reply) => {
      // Check origin for DNS rebinding protection
      const { origin } = request.headers;
      const { host } = request.headers;

      const allowedHosts = [
        `localhost:${port}`,
        `127.0.0.1:${port}`,
        `[::1]:${port}`,
      ];

      const allowedOrigins = new Set(
        allowedHosts.map((host) => `http://${host}`),
      );

      // For non-GET requests, check origin header
      if (request.method !== 'GET' && origin && !allowedOrigins.has(origin)) {
        reply.code(403).send({ error: `Blocked: invalid origin ${origin}` });
        return;
      }

      // For all requests, check host header
      if (!allowedHosts.includes(host ?? '')) {
        reply
          .code(403)
          .send({ error: `Blocked: invalid host ${host ?? 'unknown'}` });
        return;
      }

      // Check authentication token
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        reply.code(401).send({ error: 'Authorization header required' });
        return;
      }

      const requestToken = authHeader.replace('Bearer ', '');
      if (requestToken !== token) {
        reply.code(401).send({ error: 'Invalid token' });
        return;
      }
    });

    done();
  };

export const devServerAuthPlugin = fastifyPlugin(devServerAuthPluginCallback, {
  name: 'dev-server-auth',
});
