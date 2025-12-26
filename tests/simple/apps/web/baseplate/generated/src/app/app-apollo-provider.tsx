import type { ReactElement } from 'react';

import { ApolloProvider } from '@apollo/client/react';
import { useMemo } from 'react';

import { createApolloClient } from '../services/apollo';

interface Props {
  children: React.ReactNode;
}

export function AppApolloProvider({ children }: Props): ReactElement {
  const client = useMemo(() => createApolloClient(), []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
