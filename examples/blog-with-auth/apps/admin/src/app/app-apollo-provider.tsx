import type { ReactElement } from 'react';

import { ApolloProvider } from '@apollo/client/react';
import { useMemo } from 'react';

import { createApolloClient } from '../services/apollo';

interface Props {
  children: React.ReactNode;
}

export function AppApolloProvider({ children }: Props): ReactElement {
  /* TPL_RENDER_BODY:BLOCK */

  const client = useMemo(
    () => createApolloClient(/* TPL_CREATE_ARGS:INLINE */),
    [
      /* TPL_MEMO_DEPENDENCIES:INLINE */
    ],
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
