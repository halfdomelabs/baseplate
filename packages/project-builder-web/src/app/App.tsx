import { ConfirmDialogPopper } from '@halfdomelabs/ui-components';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'src/components/ErrorBoundary/ErrorBoundary';
import PagesRoot from '../pages';
import { ClientVersionGate } from './components/ClientVersionGate';
import { ProjectChooserGate } from './components/ProjectChooserGate';
import { ProjectConfigGate } from './components/ProjectConfigGate';

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ClientVersionGate>
          <ProjectChooserGate>
            <ProjectConfigGate>
              <PagesRoot />
            </ProjectConfigGate>
          </ProjectChooserGate>
          <Toaster />
          <ConfirmDialogPopper />
        </ClientVersionGate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
