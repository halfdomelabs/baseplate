// @ts-nocheck

import { useAuth0 } from '@auth0/auth0-react';
import { logError } from '%react-error/logger';

export function useLogOut(): () => void {
  const { logout } = useAuth0();

  return () => {
    logout({ logoutParams: { returnTo: window.location.origin } }).catch(
      (err) => logError(err),
    );
  };
}
