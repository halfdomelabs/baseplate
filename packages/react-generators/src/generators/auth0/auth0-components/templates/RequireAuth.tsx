// @ts-nocheck

import { withAuthenticationRequired } from '@auth0/auth0-react';
import Spinner from '../Spinner';

interface Props {
  children: JSX.Element;
}

function RequireAuth({ children }: Props): JSX.Element {
  return children;
}

export default withAuthenticationRequired(RequireAuth, {
  onRedirecting: () => (
    <div className="flex h-full items-center justify-center">
      <Spinner size="large" />
    </div>
  ),
});
