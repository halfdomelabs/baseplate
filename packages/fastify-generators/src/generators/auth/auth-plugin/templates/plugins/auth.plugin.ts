// @ts-nocheck

import { requestContext } from '@fastify/request-context';
import fp from 'fastify-plugin';
import { userSessionService } from '%user-session-service';
import { AuthContext } from '%auth-context/types';
import { createAuthContextFromSessionInfo } from '%auth-context/utils';
import type { UserSessionService } from '%user-session-types';

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

export const authPlugin = fp(async (fastify) => {
  fastify.decorateRequest('auth');

  fastify.addHook('onRequest', async (req, res) => {
    const userSessionInfo = await (
      userSessionService as UserSessionService
    ).getSessionInfoFromRequest(req, res);

    const authContext = createAuthContextFromSessionInfo(userSessionInfo);

    req.auth = authContext;

    requestContext.set('userId', userSessionInfo?.userId);
  });
});
