// @ts-nocheck

import { UnauthorizedError } from '%http-errors';
import { AuthRole } from '%role-service';

export interface UserInfo {
  id: string;
}

export interface AuthInfo {
  user: UserInfo | null;
  requiredUser: () => UserInfo;
  roles: AuthRole[];
  hasSomeRole: (possibleRoles: AuthRole[]) => boolean;
}

export function createAuthInfoFromUser(
  user: UserInfo | null,
  roles: AuthRole[]
): AuthInfo {
  return {
    user,
    requiredUser: () => {
      if (!user) {
        throw new UnauthorizedError('User is required');
      }
      return user;
    },
    roles,
    hasSomeRole: (possibleRoles) =>
      roles.some((role) => possibleRoles.includes(role)),
  };
}
