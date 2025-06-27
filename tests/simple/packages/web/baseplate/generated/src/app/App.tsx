import type { ReactElement } from 'react';

import { BrowserRouter } from 'react-router-dom';

import { ConfirmDialog, Toaster } from '../components';
import { ErrorBoundary } from '../components/error-boundary/error-boundary';
import PagesRoot from '../pages';
import AppApolloProvider from './AppApolloProvider';

function App(): ReactElement {
  return (
    <ErrorBoundary>
      <AppApolloProvider>
        <BrowserRouter>
          <PagesRoot />
          <ConfirmDialog />
          <Toaster />
        </BrowserRouter>
      </AppApolloProvider>
    </ErrorBoundary>
  );
}

export default App;
