// @ts-nocheck

import type { ReactElement } from 'react';

import { createApolloClient } from '$service';
import { ApolloProvider } from '@apollo/client/react';
import { useMemo } from 'react';

interface Props {
  children: React.ReactNode;
}

export function AppApolloProvider({ children }: Props): ReactElement {
  TPL_RENDER_BODY;

  const client = useMemo(
    () => createApolloClient(TPL_CREATE_ARGS),
    [TPL_MEMO_DEPENDENCIES],
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
