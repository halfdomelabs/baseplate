// @ts-nocheck

import type { AuthContext } from '$authContextTypes';
import type { AuthSessionInfo } from '$authSessionTypes';

import { DEFAULT_PUBLIC_ROLES } from '%authRolesImports';
import { UnauthorizedError } from '%errorHandlerServiceImports';

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
      if (!session || session.type !== 'user') {
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
