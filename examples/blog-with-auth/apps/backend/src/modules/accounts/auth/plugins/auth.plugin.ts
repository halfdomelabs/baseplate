import { requestContext } from '@fastify/request-context';
import fp from 'fastify-plugin';

import type { PluginRuntimeWithServices } from '@src/utils/app-modules.js';

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
  runtime: PluginRuntimeWithServices<'userSession'>;
}>(
  (fastify, { runtime }, done) => {
    const { userSession: userSessionService } = runtime.services;

    fastify.decorateRequest('auth');

    fastify.addHook('onRequest', async (req, reply) => {
      const userSessionInfo =
        await userSessionService.getSessionInfoFromRequest(req, reply);

      const authContext = createAuthContextFromSessionInfo(userSessionInfo);

      req.auth = authContext;

      requestContext.set('userId', userSessionInfo?.userId);
    });

    done();
  },
  { name: 'auth' },
);
