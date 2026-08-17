import { createContext, useContext } from 'react';

import type { AuthRole } from '../gql/graphql';

export interface SessionData {
  userId: string | undefined;
  /** Whether a user is signed in, which is true even while roles are pending. */
  isAuthenticated: boolean;
  /** Server-issued roles: `['public']` when signed out and empty while pending. */
  roles: AuthRole[];
  /**
   * Whether the identity is known but its roles have not been confirmed by the
   * server yet. Role checks should be skipped while this is true.
   */
  isPending: boolean;
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

export type { AuthRole } from '@src/gql/graphql';
