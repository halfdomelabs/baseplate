import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { ConfirmDialog } from '../components';
import { ErrorBoundary } from '../components/ErrorBoundary';
import PagesRoot from '../pages';
import AppApolloProvider from './AppApolloProvider';

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppApolloProvider>
          <PagesRoot />
          <Toaster />
          <ConfirmDialog />
        </AppApolloProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
