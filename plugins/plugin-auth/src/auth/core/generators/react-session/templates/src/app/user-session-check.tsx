// @ts-nocheck

import { GetCurrentUserSessionDocument } from '%generatedGraphqlImports';
import { useQuery } from '@apollo/client';
import { useEffect } from 'react';

import { useUserSessionClient } from '../hooks/use-user-session-client.js';

/**
 * Checks if the user session matches the loaded ID on first page load.
 *
 * This ensures that we have the correct user ID loaded on first page load.
 */
export function UserSessionCheck(): React.ReactElement | null {
  const { data } = useQuery(GetCurrentUserSessionDocument, {
    fetchPolicy: 'no-cache',
  });
  const { client } = useUserSessionClient();

  useEffect(() => {
    if (!data?.currentUserSession?.userId) return;

    if (data.currentUserSession.userId !== client.getSession()?.userId) {
      client.signOut();
    }
  }, [data, client]);

  return null;
}
