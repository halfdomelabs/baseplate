// @ts-nocheck

import { useAuth } from '@auth/auth-react';
import { useMemo } from 'react';

export interface SessionData {
  userId: string | null;
  isAuthenticated: boolean;
}
const USER_ID_CLAIM = 'https://app.com/user_id';

export function useSession(): SessionData {
  const { user, isAuthenticated } = useAuth();

  const sessionData: SessionData = useMemo(
    () => ({
      userId: (user?.[USER_ID_CLAIM] ?? null) as string | null,
      isAuthenticated,
    }),
    [user, isAuthenticated],
  );
  return sessionData;
}
