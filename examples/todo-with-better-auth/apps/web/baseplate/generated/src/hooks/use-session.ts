import { useMemo } from 'react';

import { authClient } from '../services/auth-client';

export const AUTH_ROLES = /* TPL_AUTH_ROLES:START */ [
  'admin',
  'pro-user',
  'public',
  'system',
  'user',
] /* TPL_AUTH_ROLES:END */ as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export interface SessionData {
  userId: string | undefined;
  isAuthenticated: boolean;
  roles: AuthRole[];
  isPending: boolean;
}

export function useSession(): SessionData {
  const { data: session, isPending } = authClient.useSession();

  const sessionData: SessionData = useMemo(
    () => ({
      userId: session?.user.id,
      isAuthenticated: !!session,
      roles: session ? (session.session.roles as AuthRole[]) : ['public'],
      isPending,
    }),
    [session, isPending],
  );
  return sessionData;
}
