// @ts-nocheck

import { useAuth0 } from '@auth0/auth0-react';
import { useMemo } from 'react';

export interface SessionData {
  userId: string | undefined;
  isAuthenticated: boolean;
}
const USER_ID_CLAIM = 'https://app.com/user_id';

export function useSession(): SessionData {
  const { user, isAuthenticated } = useAuth0();

  const sessionData: SessionData = useMemo(
    () => ({
      userId: user?.[USER_ID_CLAIM] as string | undefined,
      isAuthenticated,
    }),
    [user, isAuthenticated],
  );
  return sessionData;
}
