// @ts-nocheck

import type { AppServices } from '%appRuntimeImports';
import type { AuthContext } from '%authContextImports';

import { createAuthContextFromSessionInfo } from '%authContextImports';
import { requestContext } from '@fastify/request-context';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    userId?: string;
  }
}

export const authPlugin = fp<{
  services: Pick<AppServices, 'userSession'>;
}>(
  (fastify, { services }, done) => {
    fastify.decorateRequest('auth');

    fastify.addHook('onRequest', async (req, reply) => {
      const userSessionInfo =
        await services.userSession.getSessionInfoFromRequest(req, reply);

      const authContext = createAuthContextFromSessionInfo(userSessionInfo);

      req.auth = authContext;

      requestContext.set('userId', userSessionInfo?.userId);
    });

    done();
  },
  { name: 'auth' },
);
