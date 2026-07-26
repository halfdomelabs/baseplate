import { requestContext } from '@fastify/request-context';
import fp from 'fastify-plugin';

import type { AppServices } from '@src/utils/runtime-services.js';

import type { AuthContext } from '../types/auth-context.types.js';

import { createAuthContextFromSessionInfo } from '../utils/auth-context.utils.js';

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
