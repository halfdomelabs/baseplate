// @ts-nocheck

import { useSession } from './use-session.js';

/**
 * Provides the current user id or throws an error if the user is not authenticated
 */
export function useUserIdOrThrow(): string {
  const { userId } = useSession();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}
