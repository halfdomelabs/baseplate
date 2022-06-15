// @ts-nocheck
import { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { stripBearer } from '../utils/headers';
import { authService } from '%auth-service';

export interface AuthInfo {
  AUTH_TYPE;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthInfo;
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

    req.auth = AUTH_OBJECT;
  });
});
