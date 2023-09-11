// @ts-nocheck
import fp from 'fastify-plugin';
import { createAuthInfoFromAuthorization } from '%auth-service';
import { AuthInfo, UserInfo } from '%auth-info';
import { requestContext } from '@fastify/request-context';

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

export const authPlugin = fp(async (fastify) => {
  fastify.decorateRequest('auth', null);

  fastify.addHook('onRequest', async (req) => {
    const authInfo = await createAuthInfoFromAuthorization(
      req.headers.authorization,
    );

    req.auth = authInfo;

    requestContext.set('user', authInfo.user);
  });
});
