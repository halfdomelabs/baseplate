// @ts-nocheck

import { useSession } from '$useSession';

/**
 * Provides the current user id or throws an error if the user is not authenticated
 * @returns Current user ID
 * @throws Error if user is not authenticated
 */
export function useUserIdOrThrow(): string {
  const session = useSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  return session.userId;
}
