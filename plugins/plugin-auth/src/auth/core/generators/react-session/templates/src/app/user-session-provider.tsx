// @ts-nocheck

import type React from 'react';

import { useEffect, useMemo, useState } from 'react';

import type { UserSessionClientContextValue } from '../hooks/use-user-session-client.js';
import type { UserSessionData } from '../services/user-session-client.js';

import { UserSessionClientContext } from '../hooks/use-user-session-client.js';
import { createUserSessionClient } from '../services/user-session-client.js';

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
