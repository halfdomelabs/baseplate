// @ts-nocheck

import { FastifyRequest } from 'fastify';
import { AuthInfo, createAuthInfoFromUser, UserInfo } from '../utils/auth-info';
import { populateAuthRoles } from '%role-service';

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
  exp: number;
}

export async function getUserInfoFromRequest(
  req: FastifyRequest,
): Promise<(UserInfo & { roles: string[] }) | null> {
  if (!req.headers.authorization) {
    return null;
  }

  const verifiedJwt = await req.jwtVerify<Auth0Jwt>();
  const userId = verifiedJwt[USER_ID_CLAIM];
  const roles = verifiedJwt[ROLES_CLAIM] ?? [];
  const email = verifiedJwt[EMAIL_CLAIM];

  if (!userId) {
    throw new Error(`Missing user id in JWT`);
  }

  const user = await USER_MODEL.findUnique({ where: { id: userId } });

  // create user if one does not exist already
  if (!email) {
    throw new Error(`Missing email claim in JWT`);
  }
  if (!user) {
    // Use createMany to avoid race-conditions with creating the user
    await prisma.user.createMany({
      data: [
        {
          id: userId,
          auth0Id: verifiedJwt.sub,
          email,
        },
      ],
      skipDuplicates: true,
    });
  }

  return {
    id: userId,
    email,
    roles: roles.includes('user') ? roles : ['user', ...roles],
    tokenExpiry:
      typeof verifiedJwt.exp === 'number'
        ? new Date(verifiedJwt.exp * 1000)
        : undefined,
  };
}

export async function createAuthInfoFromRequest(
  req: FastifyRequest,
): Promise<AuthInfo> {
  const user = await getUserInfoFromRequest(req);
  if (!user) {
    return createAuthInfoFromUser(null, ['anonymous']);
  }

  const roles = populateAuthRoles(user?.roles);

  return createAuthInfoFromUser(user, roles);
}

export async function createAuthInfoFromAuthorization(
  req: FastifyRequest,
  authorization: string | undefined,
): Promise<AuthInfo> {
  // We have to manually add the header to the request since we can't
  // use server.jwt.verify due to an error
  req.headers.authorization = authorization;
  return createAuthInfoFromRequest(req);
}
