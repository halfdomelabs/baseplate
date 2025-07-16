// @ts-nocheck

import type { AuthContext } from '$authContextTypes';
import type { AuthSessionInfo } from '$authSessionTypes';

import { DEFAULT_PUBLIC_ROLES } from '%authRolesImports';
import { UnauthorizedError } from '%errorHandlerServiceImports';

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
