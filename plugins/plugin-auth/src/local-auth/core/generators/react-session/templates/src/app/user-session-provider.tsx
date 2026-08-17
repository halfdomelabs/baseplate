// @ts-nocheck

import type React from 'react';

import { userSessionClient } from '$userSessionClient';
import { graphql } from '%graphqlImports';
import { AuthSessionContext } from '%localAuthHooksImports';
import { ErrorableLoader } from '%reactComponentsImports';
import { logError } from '%reactErrorImports';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { useEffect, useRef, useSyncExternalStore } from 'react';

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

  // The session comes from the session client rather than the query, since signing
  // in clears the Apollo cache and would otherwise blank the session mid-transition.
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

  // Only reachable before the first session is known, when nothing has mounted yet.
  if (!session) {
    return <ErrorableLoader error={sessionError} />;
  }

  return (
    <AuthSessionContext.Provider value={session}>
      {children}
    </AuthSessionContext.Provider>
  );
}
