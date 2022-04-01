// @ts-nocheck

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { AuthPayload } from './types';
import {
  RefreshTokenDocument,
  RefreshTokenMutation,
  RefreshTokenMutationVariables,
} from '%react-apollo/generated';

const refreshApolloClient = new ApolloClient({
  uri: API_ENDPOINT_URI,
  cache: new InMemoryCache(),
});

async function refreshAccessToken(
  userId: string,
  refreshToken?: string | null
): Promise<AuthPayload> {
  const { data } = await refreshApolloClient.mutate<
    RefreshTokenMutation,
    RefreshTokenMutationVariables
  >({
    mutation: RefreshTokenDocument,
    variables: {
      input: { userId, refreshToken },
    },
    fetchPolicy: 'no-cache',
  });

  if (!data?.refreshToken?.authPayload) {
    throw new Error('No data returned from refresh token mutation');
  }

  return data.refreshToken.authPayload;
}

// wrapper to ensure we don't run multiple refreshes at once
let refreshPromise: Promise<AuthPayload> | null = null;

// TODO: This should use https://github.com/supertokens/browser-tabs-lock to sync across tabs

export async function getRefreshedAccessToken(
  userId: string,
  refreshToken?: string | null
): Promise<AuthPayload> {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = refreshAccessToken(userId, refreshToken).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}
