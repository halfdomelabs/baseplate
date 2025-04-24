// @ts-nocheck

import type { AuthRole } from '%authRolesImports';

import type { AuthSessionInfo } from './auth-session.types.js';

export interface AuthContext {
  session: AuthSessionInfo | undefined;
  sessionOrThrow: () => AuthSessionInfo;
  userId: string | undefined;
  userIdOrThrow: () => string;
  roles: readonly AuthRole[];
  hasRole: (role: AuthRole) => boolean;
  hasSomeRole: (roles: AuthRole[]) => boolean;
}
