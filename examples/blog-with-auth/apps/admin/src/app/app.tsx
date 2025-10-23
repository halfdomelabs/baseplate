import type { ReactElement } from 'react';

import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { ErrorBoundary } from '../components/ui/error-boundary';
import { Toaster } from '../components/ui/toaster';
import { AppApolloProvider } from './app-apollo-provider';
import { AppRoutes } from './router';
import { UserSessionProvider } from './user-session-provider';

export function App(): ReactElement {
  return (
    /* TPL_RENDER_ROOT:START */ <ErrorBoundary>
      <AppApolloProvider>
        <UserSessionProvider>
          <AppRoutes />
          <ConfirmDialog />
          <Toaster />
        </UserSessionProvider>
      </AppApolloProvider>
    </ErrorBoundary> /* TPL_RENDER_ROOT:END */
  );
}
