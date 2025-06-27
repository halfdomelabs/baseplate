// @ts-nocheck

import type { ReactElement } from 'react';

import { Loader } from '%reactComponentsImports';
import { withAuthenticationRequired } from '@auth0/auth0-react';

interface Props {
  children: ReactElement;
}

function RequireAuthRoot({ children }: Props): ReactElement {
  return children;
}

export const RequireAuth = withAuthenticationRequired(RequireAuthRoot, {
  onRedirecting: () => (
    <div className="flex h-full items-center justify-center">
      <Loader />
    </div>
  ),
});
