// @ts-nocheck

import type { Auth } from '$auth';
import type { AuthUserSessionInfo } from '%authContextImports';
import type { UserSessionService } from '%userSessionTypesImports';
import type { FastifyRequest } from 'fastify';

import { cookiePrefix } from '$auth';
import { toWebHeaders } from '$headersUtils';

function toSessionInfo(
  session: Auth['$Infer']['Session'],
): AuthUserSessionInfo {
  return {
    id: session.session.id,
    type: 'user',
    userId: session.user.id,
    roles: session.session.roles,
    expiresAt: new Date(session.session.expiresAt),
  };
}

/**
 * Creates a {@link UserSessionService} backed by Better Auth.
 *
 * @param auth - The {@link Auth} instance to look up sessions with.
 * @returns A {@link UserSessionService} implementation.
 */
export function createBetterAuthUserSessionService(
  auth: Auth,
): UserSessionService {
  return {
    /**
     * Retrieves the user session information from the request.
     *
     * Better Auth looks up sessions purely from request headers, so the
     * optional `res` parameter on {@link UserSessionService} is unused here.
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
    },

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
    },
  };
}
