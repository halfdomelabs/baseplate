// @ts-nocheck

import type { AuthUserSessionInfo } from '%authContextImports';
import type { AuthRole } from '%authRolesImports';
import type { UserSessionService } from '%userSessionTypesImports';
import type { FastifyRequest } from 'fastify';

import { DEFAULT_USER_ROLES } from '%authRolesImports';

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

export class Auth0UserSessionService implements UserSessionService {
  /**
   * Retrieves the user session information from the request.
   *
   * @param req - The Fastify request object containing the cookies.
   * @param reply - The Fastify reply object used to set or clear cookies.
   * @param currentDate - The current date used for session validation. Defaults to the current date and time.
   * @returns A promise that resolves to the authenticated user session information or null if the session is invalid.
   * @throws {InvalidSessionError} If the session is invalid or expired.
   */
  async getSessionInfoFromRequest(
    req: FastifyRequest,
  ): Promise<AuthUserSessionInfo | undefined> {
    if (!req.headers.authorization) {
      return undefined;
    }

    const verifiedJwt = await req.jwtVerify<Auth0Jwt>();
    const userId = verifiedJwt[USER_ID_CLAIM];
    const roles = verifiedJwt[ROLES_CLAIM] ?? [];
    const email = verifiedJwt[EMAIL_CLAIM];

    if (!userId) {
      throw new Error(`Missing user id in JWT`);
    }

    const user = await TPL_USER_MODEL.findUnique({ where: { id: userId } });

    // create user if one does not exist already
    if (!user) {
      if (!email) {
        throw new Error(`Missing email claim in JWT`);
      }
      // Use createMany to avoid race-conditions with creating the user
      await TPL_USER_MODEL.createMany({
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
      id: verifiedJwt.sub,
      type: 'user',
      userId,
      roles: [...DEFAULT_USER_ROLES, ...roles] as AuthRole[],
      expiresAt:
        typeof verifiedJwt.exp === 'number'
          ? new Date(verifiedJwt.exp * 1000)
          : undefined,
    };
  }

  /**
   * Retrieves the user session information from the authentication token
   *
   * @param req The request object
   * @returns The session info or undefined if no session is found
   */
  async getSessionInfoFromToken(
    req: FastifyRequest,
    token?: string | null,
  ): Promise<AuthUserSessionInfo | undefined> {
    // We have to manually add the header to the request since we can't
    // use server.jwt.verify due to an error
    req.headers.authorization = token ?? undefined;

    return this.getSessionInfoFromRequest(req);
  }
}

export const userSessionService = new Auth0UserSessionService();
