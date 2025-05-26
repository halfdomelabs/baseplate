// @ts-nocheck

import type { ReactElement } from 'react';

import { Spinner } from '%reactComponentsImports';
import { withAuthenticationRequired } from '@auth/auth-react';

interface Props {
  children: ReactElement;
}

function RequireAuth({ children }: Props): ReactElement {
  return children;
}

export default withAuthenticationRequired(RequireAuth, {
  onRedirecting: () => (
    <div className="flex h-full items-center justify-center">
      <Spinner size="large" />
    </div>
  ),
});
