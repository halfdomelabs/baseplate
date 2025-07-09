// @ts-nocheck

export interface SessionData {
  userId: string | undefined;
  isAuthenticated: boolean;
}

/**
 * Provides the current session data such as the user id and whether the user is authenticated
 */
export function useSession(): SessionData {
  throw new Error('Not implemented');
}
