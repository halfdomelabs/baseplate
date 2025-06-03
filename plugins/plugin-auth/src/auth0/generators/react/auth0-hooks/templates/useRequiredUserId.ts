// @ts-nocheck

import { useSession } from './useSession.js';

export function useRequiredUserId(): string {
  const { userId } = useSession();
  if (!userId) {
    throw new Error('User is not authenticated');
  }
  return userId;
}
