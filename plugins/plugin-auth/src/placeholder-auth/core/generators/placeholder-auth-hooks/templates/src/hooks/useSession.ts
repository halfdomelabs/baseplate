// @ts-nocheck

export interface SessionData {
  userId: string | undefined;
  isAuthenticated: boolean;
}

export function useSession(): SessionData {
  throw new Error('Not implemented');
}
