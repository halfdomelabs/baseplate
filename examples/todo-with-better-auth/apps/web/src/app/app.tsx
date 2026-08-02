import type { ReactElement } from 'react';

import { ConfirmDialog, Toaster } from '@prisma-crud/ui-shared';

import { ErrorBoundary } from '../components/ui/error-boundary';
import { AppApolloProvider } from './app-apollo-provider';
import { AuthLoadedGate } from './auth-loaded-gate';
import { AppRoutes } from './router';

export function App(): ReactElement {
  return (
    /* TPL_RENDER_ROOT:START */ <ErrorBoundary>
      <AuthLoadedGate>
        <AppApolloProvider>
          <AppRoutes />
          <ConfirmDialog />
          <Toaster />
        </AppApolloProvider>
      </AuthLoadedGate>
    </ErrorBoundary> /* TPL_RENDER_ROOT:END */
  );
}
