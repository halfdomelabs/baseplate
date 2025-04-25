// @ts-nocheck

import { ApolloProvider } from '@apollo/client';
import { useMemo } from 'react';

import { createApolloClient } from '../services/apollo/index.js';

interface Props {
  children: React.ReactNode;
}

function AppApolloProvider({ children }: Props): JSX.Element {
  TPL_RENDER_BODY;

  const client = useMemo(
    () => createApolloClient(TPL_CREATE_ARGS),
    [TPL_MEMO_DEPENDENCIES],
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default AppApolloProvider;
