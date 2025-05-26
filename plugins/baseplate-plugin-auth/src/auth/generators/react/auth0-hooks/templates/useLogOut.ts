// @ts-nocheck

import { logError } from '%reactErrorImports';
import { useAuth } from '@auth/auth-react';

export function useLogOut(): () => void {
  const { logout } = useAuth();

  return () => {
    logout({ logoutParams: { returnTo: globalThis.location.origin } }).catch(
      (err: unknown) => logError(err),
    );
  };
}
