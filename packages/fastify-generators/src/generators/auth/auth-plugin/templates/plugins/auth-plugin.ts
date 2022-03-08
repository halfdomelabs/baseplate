// @ts-nocheck
import { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { stripBearer } from '../utils/headers';

export interface AuthInfo {
  user: USER_TYPE | null;
  requiredUser: () => USER_TYPE;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthInfo;
  }
}

async function getUserFromRequest(
  req: FastifyRequest
): Promise<USER_TYPE | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const accessToken = stripBearer(authHeader);
  const user = await AUTH_SERVICE.getUserFromToken(accessToken);
  return user;
}

export const authPlugin = fp(async (fastify) => {
  fastify.decorateRequest('user', null);

  fastify.addHook('onRequest', async (req) => {
    const user = await getUserFromRequest(req);

    req.auth = {
      user,
      requiredUser: () => {
        if (!user) {
          throw new UNAUTHORIZED_ERROR('User is required');
        }
        return user;
      },
    };
  });
});
