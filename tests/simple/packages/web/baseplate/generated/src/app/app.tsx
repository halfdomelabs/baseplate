import type { ReactElement } from 'react';

import { ConfirmDialog } from '../components/ui/confirm-dialog/confirm-dialog';
import { ErrorBoundary } from '../components/ui/error-boundary/error-boundary';
import { Toaster } from '../components/ui/toaster/toaster';
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
