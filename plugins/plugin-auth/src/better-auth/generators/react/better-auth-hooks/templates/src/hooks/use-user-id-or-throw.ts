// @ts-nocheck

import { useSession } from '$useSession';

export function useUserIdOrThrow(): string {
  const { userId } = useSession();
  if (!userId) {
    throw new Error('User is not authenticated');
  }
  return userId;
}
