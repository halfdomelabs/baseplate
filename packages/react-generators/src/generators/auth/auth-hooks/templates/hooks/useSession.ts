// @ts-nocheck

import { useMemo } from 'react';
import { Subscription, useSubscription } from 'use-subscription';
import { authService } from '%auth-service';

export interface SessionData {
  userId: string | null;
  isAuthenticated: boolean;
}

export function useSession(): SessionData {
  const userIdSubscription: Subscription<string | null> = useMemo(
    () => ({
      getCurrentValue: () => authService.getUserId(),
      subscribe: (callback) => authService.onUserIdChanged(() => callback()),
    }),
    []
  );
  const userId = useSubscription(userIdSubscription);
  const sessionData: SessionData = useMemo(
    () => ({
      userId,
      requiredUserId: () => {
        if (!userId) {
          throw new Error('User is not authenticated');
        }
        return userId;
      },
      isAuthenticated: !!userId,
    }),
    [userId]
  );
  return sessionData;
}
