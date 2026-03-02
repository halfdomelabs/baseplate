import { UnauthorizedError } from '@src/utils/http-errors.js';

import type { AuthRole } from '../constants/auth-roles.constants.js';

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

export interface AuthSystemSessionInfo extends AuthBaseSessionInfo {
  type: 'system';
}

export type AuthSessionInfo = AuthUserSessionInfo | AuthSystemSessionInfo;
