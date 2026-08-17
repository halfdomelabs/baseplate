import type React from 'react';

import { useApolloClient, useQuery } from '@apollo/client/react';
import { useEffect, useRef, useSyncExternalStore } from 'react';

import { ErrorableLoader } from '../components/ui/errorable-loader';
import { graphql } from '../gql';
import { AuthSessionContext } from '../hooks/use-session';
import { logError } from '../services/error-logger';
import { userSessionClient } from '../services/user-session-client';

interface UserSessionProviderProps {
  children: React.ReactNode;
}

const getCurrentUserSessionQuery = graphql(`
  query CurrentUserSession {
    currentUserSession {
      userId
      roles
    }
  }
`);

export function UserSessionProvider({
  children,
}: UserSessionProviderProps): React.JSX.Element {
  const apolloClient = useApolloClient();

  const session = useSyncExternalStore(
    userSessionClient.subscribe,
    userSessionClient.getSession,
  );

  const { data: sessionQueryData, error: sessionError } = useQuery(
    getCurrentUserSessionQuery,
    {
      notifyOnNetworkStatusChange: true,
    },
  );

  useEffect(() => {
    if (!sessionQueryData) return;
    userSessionClient.setServerSession(
      sessionQueryData.currentUserSession ?? undefined,
    );
  }, [sessionQueryData]);

  // The Apollo cache belongs to exactly one identity, so reset it whenever the
  // identity changes and no data fetched for the previous user survives.
  const cacheUserId = useRef(userSessionClient.getPersistedUserId());
  useEffect(() => {
    if (!session || session.userId === cacheUserId.current) return;
    cacheUserId.current = session.userId;
    apolloClient.resetStore().catch(logError);
  }, [session, apolloClient]);

  if (!session) {
    return <ErrorableLoader error={sessionError} />;
  }

  return (
    <AuthSessionContext.Provider value={session}>
      {children}
    </AuthSessionContext.Provider>
  );
}
