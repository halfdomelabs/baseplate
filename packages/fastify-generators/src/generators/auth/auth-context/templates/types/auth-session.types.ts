// @ts-nocheck

import { UnauthorizedError } from '%http-errors';
import { AuthRole } from '%auth-roles';

/**
 * Error thrown when a session is invalid
 */
export class InvalidSessionError extends UnauthorizedError {
  constructor(message = 'Invalid Session') {
    super(message, 'invalid-session');
  }
}

interface AuthBaseSessionInfo {
  id: string;
  expiresAt?: Date;
  roles: AuthRole[];
}

export interface AuthUserSessionInfo extends AuthBaseSessionInfo {
  type: 'user';
  userId: string;
}

export type AuthSessionInfo = AuthUserSessionInfo;
