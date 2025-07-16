// @ts-nocheck

import type { UserSessionClient, UserSessionData } from '$userSessionClient';

import { createContext, useContext } from 'react';

export interface UserSessionClientContextValue {
  client: UserSessionClient;
  session: UserSessionData | undefined;
}

export const UserSessionClientContext = createContext<
  UserSessionClientContextValue | undefined
>(undefined);

/**
 * Hook to get the user session client
 * @returns The user session client
 */
export function useUserSessionClient(): UserSessionClientContextValue {
  const client = useContext(UserSessionClientContext);

  if (!client) {
    throw new Error(
      'useUserSessionClient must be used within a UserSessionClientProvider',
    );
  }

  return client;
}
