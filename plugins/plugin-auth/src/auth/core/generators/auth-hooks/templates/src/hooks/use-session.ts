// @ts-nocheck

import type { UserSessionData } from '%reactSessionImports';

import { useUserSessionClient } from '%reactSessionImports';

/**
 * Provides the current session data such as the user id and whether the user is authenticated
 * This is the primary hook for accessing authentication state
 * @returns Current session data with computed isAuthenticated
 */
export function useSession(): UserSessionData | undefined {
  const { session } = useUserSessionClient();

  return session;
}
