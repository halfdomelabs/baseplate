import type { ReactElement } from 'react';

import { Auth0Provider } from '@auth0/auth0-react';

import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { ErrorBoundary } from '../components/ui/error-boundary';
import { Toaster } from '../components/ui/toaster';
import { config } from '../services/config';
import { AppApolloProvider } from './app-apollo-provider';
import { AuthLoadedGate } from './auth-loaded-gate';
import { AppRoutes } from './router';

export function App(): ReactElement {
  return (
    /* TPL_RENDER_ROOT:START */ <ErrorBoundary>
      <Auth0Provider
        domain={config.VITE_AUTH0_DOMAIN}
        clientId={config.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: globalThis.location.origin,
          audience: config.VITE_AUTH0_AUDIENCE,
        }}
      >
        <AuthLoadedGate>
          <AppApolloProvider>
            <AppRoutes />
            <ConfirmDialog />
            <Toaster />
          </AppApolloProvider>
        </AuthLoadedGate>
      </Auth0Provider>
    </ErrorBoundary> /* TPL_RENDER_ROOT:END */
  );
}
