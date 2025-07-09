import type { ReactElement } from 'react';

import { ConfirmDialog, Toaster } from '../components';
import { ErrorBoundary } from '../components/error-boundary/error-boundary';
import { AppApolloProvider } from './app-apollo-provider';
import { AppRoutes } from './router';

export function App(): ReactElement {
  return (
    <ErrorBoundary>
      <AppApolloProvider>
        <AppRoutes />
        <ConfirmDialog />
        <Toaster />
      </AppApolloProvider>
    </ErrorBoundary>
  );
}
