// @ts-nocheck

import { useAuth0 } from '@auth0/auth0-react';

export function useLogOut(): () => void {
  const { logout } = useAuth0();

  return () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };
}
