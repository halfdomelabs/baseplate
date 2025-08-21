import type React from 'react';

import { useApolloClient, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';

import type { SessionData } from '../hooks/use-session';

import { ErrorableLoader } from '../components/ui/errorable-loader';
import { GetCurrentUserSessionDocument } from '../generated/graphql';
import { AuthSessionContext } from '../hooks/use-session';
import { logError } from '../services/error-logger';
import { userSessionClient } from '../services/user-session-client';

interface UserSessionProviderProps {
  children: React.ReactNode;
}

export function UserSessionProvider({
  children,
}: UserSessionProviderProps): React.JSX.Element {
  const [cachedUserId, setCachedUserId] = useState<string | undefined>(
    userSessionClient.getUserId(),
  );
  const apolloClient = useApolloClient();

  const { data: sessionQueryData, error: sessionError } = useQuery(
    GetCurrentUserSessionDocument,
    {
      notifyOnNetworkStatusChange: true,
    },
  );

  const session = useMemo((): SessionData | undefined => {
    if (!sessionQueryData && cachedUserId) {
      // wait for server to fetch before loading session
      return undefined;
    }
    if (!sessionQueryData?.currentUserSession) {
      return {
        userId: undefined,
        isAuthenticated: false,
        roles: ['public'],
      };
    }
    return {
      userId: sessionQueryData.currentUserSession.userId,
      isAuthenticated: true,
      roles: sessionQueryData.currentUserSession.roles,
    };
  }, [sessionQueryData, cachedUserId]);

  useEffect(() => {
    const unsubscribe = userSessionClient.onUserIdChange((newUserId) => {
      if (newUserId !== cachedUserId) {
        setCachedUserId(newUserId);
        // Make sure to reset the Apollo client to clear any cached data
        apolloClient.resetStore().catch(logError);
      }
    });

    return unsubscribe;
  }, [cachedUserId, apolloClient]);

  if (!session) {
    return <ErrorableLoader error={sessionError} />;
  }

  return (
    <AuthSessionContext.Provider value={session}>
      {children}
    </AuthSessionContext.Provider>
  );
}
