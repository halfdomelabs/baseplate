import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'src/components/ErrorBoundary/ErrorBoundary';
import PagesRoot from '../pages';
import { ClientVersionGate } from './ClientVersionGate';
import ProjectChooserGate from './ProjectChooserGate';
import ProjectConfigGate from './ProjectConfigGate';

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
        </ClientVersionGate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
