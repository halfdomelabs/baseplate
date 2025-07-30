// @ts-nocheck

import type { SessionData } from '%authHooksImports';
import type React from 'react';

import { userSessionClient } from '$userSessionClient';
import { GetCurrentUserSessionDocument } from '%generatedGraphqlImports';
import { AuthSessionContext } from '%localAuthHooksImports';
import { ErrorableLoader } from '%reactComponentsImports';
import { logAndFormatError } from '%reactErrorImports';
import { useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';

interface UserSessionProviderProps {
  children: React.ReactNode;
}

export function UserSessionProvider({
  children,
}: UserSessionProviderProps): React.JSX.Element {
  const [cachedUserId, setCachedUserId] = useState<string | undefined>(
    userSessionClient.getUserId(),
  );

  const {
    data: sessionQueryData,
    error: sessionError,
    refetch: refetchSession,
  } = useQuery(GetCurrentUserSessionDocument, {
    notifyOnNetworkStatusChange: true,
  });

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
        refetchSession().catch((err: unknown) => {
          logAndFormatError(err);
        });
      }
    });

    return unsubscribe;
  }, [cachedUserId, refetchSession]);

  if (!session) {
    return <ErrorableLoader error={sessionError} />;
  }

  return (
    <AuthSessionContext.Provider value={session}>
      {children}
    </AuthSessionContext.Provider>
  );
}
