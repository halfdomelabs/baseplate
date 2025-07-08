// @ts-nocheck

import type { AuthUserSessionInfo } from '%authContextImports';
import type { UserSessionService } from '%userSessionTypesImports';
import type { FastifyRequest } from 'fastify';

export class PlaceholderUserSessionService implements UserSessionService {
  /**
   * Retrieves the user session information from the request.
   *
   * @param req - The Fastify request object containing the cookies.
   * @returns A promise that resolves to the authenticated user session information or null if the session is invalid.
   */
  async getSessionInfoFromRequest(
    req: FastifyRequest,
  ): Promise<AuthUserSessionInfo | undefined> {
    console.info(req.cookies);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    throw new Error('Not implemented');
  }

  /**
   * Retrieves the user session information from the authentication token
   *
   * Note: Since we use cookies, we ignore the authToken parameter
   *
   * @param req The request object
   * @returns The session info or undefined if no session is found
   */
  async getSessionInfoFromToken(
    req: FastifyRequest,
  ): Promise<AuthUserSessionInfo | undefined> {
    console.info(req.cookies);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    throw new Error('Not implemented');
  }
}

export const userSessionService = new PlaceholderUserSessionService();
