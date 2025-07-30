// @ts-nocheck

import { useAuth0 } from '@auth0/auth0-react';
import { useMemo } from 'react';

const AUTH_ROLES = TPL_AUTH_ROLES as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export interface SessionData {
  userId: string | undefined;
  isAuthenticated: boolean;
  roles: AuthRole[];
}

const USER_ID_CLAIM = 'https://app.com/user_id';
const ROLES_CLAIM = 'https://app.com/roles';

export function useSession(): SessionData {
  const { user, isAuthenticated } = useAuth0();

  const rolesClaim = user?.[ROLES_CLAIM] as string[] | undefined;

  const sessionData: SessionData = useMemo(
    () => ({
      userId: user?.[USER_ID_CLAIM] as string | undefined,
      isAuthenticated,
      roles: Array.isArray(rolesClaim)
        ? rolesClaim.filter((role): role is AuthRole =>
            AUTH_ROLES.includes(role as AuthRole),
          )
        : ['public'],
    }),
    [user, isAuthenticated, rolesClaim],
  );
  return sessionData;
}
