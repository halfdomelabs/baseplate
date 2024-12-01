// @ts-nocheck

import fastifyAuth0Verify from 'fastify-auth0-verify';
import fp from 'fastify-plugin';
import { config } from '%config';
import { requestContext } from '@fastify/request-context';
import { createAuthInfoFromRequest } from '../services/auth-service.js';
import { AuthInfo, UserInfo } from '../utils/auth-info.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthInfo;
  }
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    user: UserInfo | null | undefined;
  }
}

export const auth0Plugin = fp(async (fastify) => {
  await fastify.register(fastifyAuth0Verify, {
    domain: config.AUTH0_DOMAIN,
    audience: config.AUTH0_AUDIENCE,
  });

  fastify.decorateRequest('auth');

  fastify.addHook('onRequest', async (req) => {
    const authInfo = await createAuthInfoFromRequest(req);

    req.auth = authInfo;

    requestContext.set('user', authInfo.user);
  });
});
