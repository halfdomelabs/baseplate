import type { ReactElement } from 'react';

import { ConfirmDialog, Toaster } from '../components';
import { ErrorBoundary } from '../components/error-boundary/error-boundary';
import { AppRoutes } from './app-routes';
import AppApolloProvider from './AppApolloProvider';

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
