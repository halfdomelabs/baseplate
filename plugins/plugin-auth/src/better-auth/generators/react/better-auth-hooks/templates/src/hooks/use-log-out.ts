// @ts-nocheck

import { useCallback } from 'react';

import { logError } from '%reactErrorImports';

import { authClient } from '%betterAuthImports';

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
