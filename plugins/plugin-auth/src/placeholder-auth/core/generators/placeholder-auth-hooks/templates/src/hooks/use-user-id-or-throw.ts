// @ts-nocheck

import { useSession } from '$useSession';

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
