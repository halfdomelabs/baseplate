// @ts-nocheck

import type { AuthUserSessionInfo } from '%authContextImports';
import type { UserSessionService } from '%userSessionTypesImports';
import type { FastifyRequest } from 'fastify';

/**
 * Creates a placeholder {@link UserSessionService} that always throws. Swap
 * this out for a real auth backend (e.g. `better-auth` or `local-auth`).
 */
export function createPlaceholderUserSessionService(): UserSessionService {
  return {
    async getSessionInfoFromRequest(
      req: FastifyRequest,
    ): Promise<AuthUserSessionInfo | undefined> {
      console.info(req.cookies);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      throw new Error('Not implemented');
    },

    async getSessionInfoFromToken(
      req: FastifyRequest,
    ): Promise<AuthUserSessionInfo | undefined> {
      console.info(req.cookies);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      throw new Error('Not implemented');
    },
  };
}
