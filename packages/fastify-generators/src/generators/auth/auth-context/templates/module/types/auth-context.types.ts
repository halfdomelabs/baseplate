// @ts-nocheck

import type { AuthSessionInfo } from '$authSessionTypes';
import type { AuthRole } from '%authRolesImports';

export interface AuthContext {
  session: AuthSessionInfo | undefined;
  sessionOrThrow: () => AuthSessionInfo;
  userId: string | undefined;
  userIdOrThrow: () => string;
  roles: readonly AuthRole[];
  hasRole: (role: AuthRole) => boolean;
  hasSomeRole: (roles: AuthRole[]) => boolean;
}
