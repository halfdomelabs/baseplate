import { useCallback } from 'react';

import { authClient } from '../services/auth-client';
import { logError } from '../services/error-logger';

export function useLogOut(): () => void {
  return useCallback(() => {
    authClient
      .signOut()
      .then(() => {
        globalThis.location.href = '/';
      })
      .catch((err: unknown) => logError(err));
  }, []);
}
