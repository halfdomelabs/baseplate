// @ts-nocheck

import { useUserSessionClient } from '%reactSessionImports';

export interface SessionData {
  userId: string | undefined;
  isAuthenticated: boolean;
}

/**
 * Provides the current session data such as the user id and whether the user is authenticated
 * This is the primary hook for accessing authentication state
 * @returns Current session data with computed isAuthenticated
 */
export function useSession(): SessionData {
  const { session } = useUserSessionClient();

  return session
    ? {
        userId: session.userId,
        isAuthenticated: true,
      }
    : {
        userId: undefined,
        isAuthenticated: false,
      };
}
