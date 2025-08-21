import { requestContext } from '@fastify/request-context';
import fp from 'fastify-plugin';

import type { AuthContext } from '../types/auth-context.types.js';
import type { UserSessionService } from '../types/user-session.types.js';

import { userSessionService } from '../services/user-session.service.js';
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

export const authPlugin = fp((fastify, opts, done) => {
  fastify.decorateRequest('auth');

  fastify.addHook('onRequest', async (req, res) => {
    const userSessionInfo = await (
      userSessionService as UserSessionService
    ).getSessionInfoFromRequest(req, res);

    const authContext = createAuthContextFromSessionInfo(userSessionInfo);

    req.auth = authContext;

    requestContext.set('userId', userSessionInfo?.userId);
  });

  done();
});
