// @ts-nocheck

import type { AuthUserSessionInfo } from '%authContextImports';
import type { AuthRole } from '%authRolesImports';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface UserSessionPayload {
  userId: string;
  expiresAt: Date;
  roles: readonly AuthRole[];
}

export interface UserSessionService {
  /**
   * Get the session info from the request
   *
   * @param req The request object
   * @param res The response object (this may be undefined when using websockets)
   * @returns The session info or undefined if no session is found
   */
  getSessionInfoFromRequest: (
    req: FastifyRequest,
    res?: FastifyReply,
  ) => Promise<AuthUserSessionInfo | undefined>;

  /**
   * Get the session info from the authentication token
   * (handles scenarios where we cannot attach an authorization header, e.g.
   * when using websockets)
   *
   * Note: When using cookies, the token may be extracted from the request instead of the
   * authToken parameter.
   *
   * @param req The request object
   * @param authToken The authentication token
   * @returns The session info or undefined if no session is found
   */
  getSessionInfoFromToken: (
    req: FastifyRequest,
    authToken?: string | null,
  ) => Promise<AuthUserSessionInfo | undefined>;
}
