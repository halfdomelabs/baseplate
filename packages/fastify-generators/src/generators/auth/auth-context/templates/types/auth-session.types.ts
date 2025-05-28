// @ts-nocheck

import type { AuthRole } from '%authRolesImports';

import { UnauthorizedError } from '%errorHandlerServiceImports';

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
