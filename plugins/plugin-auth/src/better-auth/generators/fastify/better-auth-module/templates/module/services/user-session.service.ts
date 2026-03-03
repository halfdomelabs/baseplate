// @ts-nocheck

import type { AuthUserSessionInfo } from '%authContextImports';
import type { UserSessionService } from '%userSessionTypesImports';
import type { FastifyRequest } from 'fastify';

import { auth, cookiePrefix } from '$auth';
import { toWebHeaders } from '$headersUtils';

function toSessionInfo(
  session: typeof auth.$Infer.Session,
): AuthUserSessionInfo {
  return {
    id: session.session.id,
    type: 'user',
    userId: session.user.id,
    roles: session.session.roles,
    expiresAt: new Date(session.session.expiresAt),
  };
}

export class BetterAuthUserSessionService implements UserSessionService {
  /**
   * Retrieves the user session information from the request.
   *
   * @param req - The Fastify request object containing the cookies.
   * @returns A promise that resolves to the authenticated user session information or undefined if no session.
   */
  async getSessionInfoFromRequest(
    req: FastifyRequest,
  ): Promise<AuthUserSessionInfo | undefined> {
    const session = await auth.api.getSession({
      headers: toWebHeaders(req.headers),
    });

    if (!session) {
      return undefined;
    }

    return toSessionInfo(session);
  }

  /**
   * Retrieves the user session information from the authentication token
   *
   * @param _req The request object (unused for Better Auth cookie-based sessions)
   * @param token The session token
   * @returns The session info or undefined if no session is found
   */
  async getSessionInfoFromToken(
    _req: FastifyRequest,
    token?: string | null,
  ): Promise<AuthUserSessionInfo | undefined> {
    if (!token) {
      return undefined;
    }

    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `${cookiePrefix}.session_token=${token}`,
      }),
    });

    if (!session) {
      return undefined;
    }

    return toSessionInfo(session);
  }
}

export const userSessionService = new BetterAuthUserSessionService();
