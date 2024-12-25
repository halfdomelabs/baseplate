// @ts-nocheck

import { UnauthorizedError } from '%http-errors';
import { DEFAULT_PUBLIC_ROLES } from '%auth-roles';
import { AuthContext } from '../types/auth-context.types.js';
import { AuthSessionInfo } from '../types/auth-session.types.js';

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
  };
}
