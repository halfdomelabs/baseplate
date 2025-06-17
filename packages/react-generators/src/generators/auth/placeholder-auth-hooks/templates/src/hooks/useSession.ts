// @ts-nocheck

export interface SessionData {
  userId: string | null;
  isAuthenticated: boolean;
}

export function useSession(): SessionData {
  throw new Error('Not implemented');
}
