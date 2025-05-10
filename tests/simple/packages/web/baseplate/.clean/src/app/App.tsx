import type { ReactElement } from 'react';

import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

import { ConfirmDialog } from '../components';
import { ErrorBoundary } from '../components/ErrorBoundary';
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
