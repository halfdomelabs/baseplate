// @ts-nocheck

import type { AuthContext } from '%authContextImports';

import { createAuthContextFromSessionInfo } from '%authContextImports';
import { userSessionService } from '%userSessionServiceImports';
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

export const authPlugin = fp((fastify, opts, done) => {
  fastify.decorateRequest('auth');

  fastify.addHook('onRequest', async (req, res) => {
    const userSessionInfo = await userSessionService.getSessionInfoFromRequest(
      req,
      res,
    );

    const authContext = createAuthContextFromSessionInfo(userSessionInfo);

    req.auth = authContext;

    requestContext.set('userId', userSessionInfo?.userId);
  });

  done();
});
