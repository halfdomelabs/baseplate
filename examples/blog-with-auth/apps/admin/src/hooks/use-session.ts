import { createContext, useContext } from 'react';

import type { graphql } from '../graphql';

export type AuthRole = ReturnType<typeof graphql.scalar<'AuthRole'>>;

export interface SessionData {
  userId: string | undefined;
  isAuthenticated: boolean;
  roles: AuthRole[];
}

export const AuthSessionContext = createContext<SessionData | undefined>(
  undefined,
);

/**
 * Provides the current session data such as the user id and whether the user is authenticated
 * This is the primary hook for accessing authentication state
 * @returns Current session data with computed isAuthenticated
 */
export function useSession(): SessionData {
  const contextValue = useContext(AuthSessionContext);

  if (!contextValue) {
    throw new Error('useSession must be used within a AuthSessionProvider');
  }

  return contextValue;
}
