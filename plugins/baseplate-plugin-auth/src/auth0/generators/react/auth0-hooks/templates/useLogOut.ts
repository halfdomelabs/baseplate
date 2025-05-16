// @ts-nocheck

import { logError } from '%reactErrorImports';
import { useAuth0 } from '@auth0/auth0-react';

export function useLogOut(): () => void {
  const { logout } = useAuth0();

  return () => {
    logout({ logoutParams: { returnTo: globalThis.location.origin } }).catch(
      (err: unknown) => logError(err),
    );
  };
}
