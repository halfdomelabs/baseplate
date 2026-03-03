import type { AuthRole } from '../constants/auth-roles.constants.js';
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
