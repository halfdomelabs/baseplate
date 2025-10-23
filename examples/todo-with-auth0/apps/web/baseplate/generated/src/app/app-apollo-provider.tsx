import type { ReactElement } from 'react';

import { ApolloProvider } from '@apollo/client';
import { useAuth0 } from '@auth0/auth0-react';
import { useMemo } from 'react';

import { createApolloClient } from '../services/apollo';

interface Props {
  children: React.ReactNode;
}

export function AppApolloProvider({ children }: Props): ReactElement {
  /* TPL_RENDER_BODY:START */
  const { getAccessTokenSilently: getAccessToken } = useAuth0();
  /* TPL_RENDER_BODY:END */

  const client = useMemo(
    () =>
      createApolloClient(
        /* TPL_CREATE_ARGS:START */ {
          getAccessToken,
        } /* TPL_CREATE_ARGS:END */,
      ),
    [
      /* TPL_MEMO_DEPENDENCIES:START */ getAccessToken /* TPL_MEMO_DEPENDENCIES:END */,
    ],
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
