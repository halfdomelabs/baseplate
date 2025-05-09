// @ts-nocheck

import { DEFAULT_PUBLIC_ROLES } from '%authRolesImports';
import { UnauthorizedError } from '%errorHandlerServiceImports';

import type { AuthContext } from '../types/auth-context.types.js';
import type { AuthSessionInfo } from '../types/auth-session.types.js';

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
      if (!session || (session.type as string) !== 'user') {
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
