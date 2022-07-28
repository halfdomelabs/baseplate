// @ts-nocheck
import { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { stripBearer } from '../utils/headers';
import { authService } from '%auth-service';
import { AuthInfo, UserInfo, createAuthInfoFromUser } from '../utils/auth-info';
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

async function getUserFromRequest(
  req: FastifyRequest
): Promise<AUTH_USER | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const accessToken = stripBearer(authHeader);
  const user = await authService.getUserFromToken(accessToken);
  return user;
}

export const authPlugin = fp(async (fastify) => {
  fastify.decorateRequest('auth', null);

  fastify.addHook('onRequest', async (req) => {
    const user = await getUserFromRequest(req);

    HOOK_BODY;

    req.auth = createAuthInfoFromUser(user, EXTRA_ARGS);

    requestContext.set('user', user);
  });
});
