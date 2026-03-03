// @ts-nocheck

import { auth } from '$auth';
import { toWebHeaders } from '$headersUtils';
import fp from 'fastify-plugin';

export const betterAuthPlugin = fp(
  (fastify, _opts, done) => {
    fastify.all('/auth/*', async (request, reply) => {
      const url = new URL(request.url, `http://${request.headers.host}`);

      const req = new Request(url.toString(), {
        method: request.method,
        headers: toWebHeaders(request.headers),
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      const response = await auth.handler(req);

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
