// @ts-nocheck

import { authClient } from '%betterAuthImports';
import { logError } from '%reactErrorImports';
import { useCallback } from 'react';

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
