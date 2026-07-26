import fp from 'fastify-plugin';

import type { AppServices } from '@src/utils/runtime-services.js';

import { toWebHeaders } from '../utils/headers.utils.js';

export const betterAuthPlugin = fp<{
  services: Pick<AppServices, 'betterAuth'>;
}>(
  (fastify, { services }, done) => {
    fastify.all('/auth/*', async (request, reply) => {
      const url = new URL(request.url, `http://${request.headers.host}`);

      const req = new Request(url.toString(), {
        method: request.method,
        headers: toWebHeaders(request.headers),
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      const response = await services.betterAuth.handler(req);

      reply.status(response.status);
      for (const [key, value] of response.headers.entries())
        reply.header(key, value);
      reply.send(response.body ? await response.text() : null);
    });

    done();
  },
  {
    name: 'better-auth',
  },
);
