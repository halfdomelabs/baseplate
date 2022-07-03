// @ts-nocheck

import { FastifyRequest } from 'fastify';
import fastifyAuth0Verify from 'fastify-auth0-verify';
import fp from 'fastify-plugin';
import { config } from '%config';
import { AuthInfo, createAuthInfoFromUser, UserInfo } from '../utils/auth-info';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthInfo;
  }
}

const USER_ID_CLAIM = 'https://app.com/user_id';
const EMAIL_CLAIM = 'https://app.com/email';
const EMAIL_VERIFIED_CLAIM = 'https://app.com/email_verified';
const ROLES_CLAIM = 'https://app.com/roles';

interface Auth0Jwt {
  [USER_ID_CLAIM]?: string;
  [EMAIL_CLAIM]?: string;
  [EMAIL_VERIFIED_CLAIM]?: boolean;
  [ROLES_CLAIM]?: string[];
  sub: string;
  email: string;
}

async function getUserFromRequest(
  req: FastifyRequest
): Promise<(UserInfo & { roles: string[] }) | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const verifiedJwt = await req.jwtVerify<Auth0Jwt>();
  const userId = verifiedJwt[USER_ID_CLAIM];
  const roles = verifiedJwt[ROLES_CLAIM];

  if (!userId) {
    throw new Error(`Missing user id in JWT`);
  }

  const user = await USER_MODEL.findUnique({ where: { id: userId } });

  // create user if one does not exist already
  if (!user) {
    if (!verifiedJwt[EMAIL_CLAIM]) {
      throw new Error(`Missing email claim in JWT`);
    }

    await USER_MODEL.create({
      data: {
        id: userId,
        auth0Id: verifiedJwt.sub,
        email: verifiedJwt[EMAIL_CLAIM],
      },
    });
  }

  return {
    id: userId,
    roles: roles?.includes('user') ? roles : ['user', ...(roles || [])],
  };
}

export const auth0Plugin = fp(async (fastify) => {
  await fastify.register(fastifyAuth0Verify, {
    domain: config.AUTH0_DOMAIN,
    audience: config.AUTH0_AUDIENCE,
  });

  fastify.decorateRequest('auth', null);

  fastify.addHook('onRequest', async (req) => {
    const user = await getUserFromRequest(req);

    const roles = AUTH_ROLE_SERVICE.populateAuthRoles(user?.roles);

    req.auth = createAuthInfoFromUser(user, roles);
  });
});
