import { UnauthorizedError } from '@src/utils/http-errors.js';

import type { AuthContext } from '../types/auth-context.types.js';
import type { AuthSessionInfo } from '../types/auth-session.types.js';

import { DEFAULT_PUBLIC_ROLES } from '../constants/auth-roles.constants.js';

/**
 * Creates an auth context from session info.
 * @param session - The session info.
 * @returns An auth context.
 */
export function createAuthContextFromSessionInfo(
  session: AuthSessionInfo | undefined,
): AuthContext {
  const roles = session?.roles ?? DEFAULT_PUBLIC_ROLES;

  return {
    session,
    sessionOrThrow: () => {
      if (!session) {
        throw new UnauthorizedError('Session is required');
      }
      return session;
    },
    userId: session?.type === 'user' ? session.userId : undefined,
    userIdOrThrow: () => {
      if (session?.type !== 'user') {
        throw new UnauthorizedError('User session is required');
      }
      return session.userId;
    },
    roles,
    hasRole: (role) => roles.includes(role),
    hasSomeRole: (possibleRoles) =>
      possibleRoles.some((role) => roles.includes(role)),
  };
}

/**
 * Creates an auth context for the system user.
 * @returns An auth context for the system user.
 */
export function createSystemAuthContext(): AuthContext {
  return createAuthContextFromSessionInfo({
    id: 'system',
    roles: ['system'],
    type: 'system',
  });
}
