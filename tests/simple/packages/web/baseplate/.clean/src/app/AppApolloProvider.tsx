import { ApolloProvider } from '@apollo/client';
import { useMemo } from 'react';

import { createApolloClient } from '../services/apollo';

interface Props {
  children: React.ReactNode;
}

function AppApolloProvider({ children }: Props): JSX.Element {
  const client = useMemo(() => createApolloClient(), []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default AppApolloProvider;
