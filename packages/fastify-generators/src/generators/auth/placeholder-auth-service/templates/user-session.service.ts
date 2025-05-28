// @ts-nocheck

import type { UserSessionService } from '%userSessionTypesImports';
import type { FastifyRequest } from 'fastify';

export class PlaceholderSessionService implements UserSessionService {
  /**
   * Retrieves the user session information from the request.
   *
   * @param req The request object
   * @param res The response object (this may be undefined when using websockets)
   * @returns The session info or undefined if no session is found
   */
  async getSessionInfoFromRequest(
    req: FastifyRequest,
  ): Promise<AuthUserSessionInfo | undefined> {
    throw new Error('Not implemented');
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
    throw new Error('Not implemented');
  }
}

export const userSessionService = new PlaceholderSessionService();
