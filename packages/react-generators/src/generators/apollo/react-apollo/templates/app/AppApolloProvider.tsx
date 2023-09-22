// @ts-nocheck

import { ApolloProvider } from '@apollo/client';
import { useMemo } from 'react';
import { createApolloClient } from '%react-apollo/client';

interface Props {
  children: React.ReactNode;
}

function AppApolloProvider({ children }: Props): JSX.Element {
  RENDER_BODY;

  const client = useMemo(
    () => createApolloClient(CREATE_ARG_VALUE),
    [CREATE_ARGS],
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default AppApolloProvider;
