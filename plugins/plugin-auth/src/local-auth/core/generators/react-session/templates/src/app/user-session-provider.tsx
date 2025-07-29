// @ts-nocheck

import type { UserSessionData } from '$userSessionClient';
import type { UserSessionClientContextValue } from '$useUserSessionClient';
import type React from 'react';

import { createUserSessionClient } from '$userSessionClient';
import { UserSessionClientContext } from '$useUserSessionClient';
import { useEffect, useMemo, useState } from 'react';

interface UserSessionProviderProps {
  children: React.ReactNode;
}

export function UserSessionProvider({
  children,
}: UserSessionProviderProps): React.JSX.Element {
  const [userSessionClient] = useState(() => createUserSessionClient());
  const [session, setSession] = useState<UserSessionData | undefined>(
    userSessionClient.getSession(),
  );

  // Subscribe to session changes
  useEffect(
    () =>
      userSessionClient.onSessionChange((newSession) => {
        setSession(newSession);
      }),
    [userSessionClient],
  );

  const contextValue: UserSessionClientContextValue = useMemo(
    () => ({
      client: userSessionClient,
      session,
    }),
    [userSessionClient, session],
  );

  return (
    <UserSessionClientContext.Provider value={contextValue}>
      {children}
    </UserSessionClientContext.Provider>
  );
}
