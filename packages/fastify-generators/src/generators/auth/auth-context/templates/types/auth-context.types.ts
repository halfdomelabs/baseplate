// @ts-nocheck

import { AuthRole } from '%auth-roles';
import { AuthSessionInfo } from './auth-session.types.js';

export interface AuthContext {
  session: AuthSessionInfo | undefined;
  sessionOrThrow: () => AuthSessionInfo;
  userId: string | undefined;
  userIdOrThrow: () => string;
  roles: readonly AuthRole[];
  hasRole: (role: AuthRole) => boolean;
}
