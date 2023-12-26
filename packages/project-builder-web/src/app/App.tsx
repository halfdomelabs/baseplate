import { ConfirmDialog } from '@halfdomelabs/ui-components';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

import { ClientVersionGate } from './components/ClientVersionGate';
import { ProjectChooserGate } from './components/ProjectChooserGate';
import { ProjectConfigGate } from './components/ProjectConfigGate';
import PagesRoot from '../pages';
import { RefIssueDialog } from '@src/components/RefIssueDialog/RefIssueDialog';
import { ErrorBoundary } from 'src/components/ErrorBoundary/ErrorBoundary';

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ClientVersionGate>
          <ProjectChooserGate>
            <ProjectConfigGate>
              <PagesRoot />
              <RefIssueDialog />
            </ProjectConfigGate>
          </ProjectChooserGate>
          <Toaster />
          <ConfirmDialog />
        </ClientVersionGate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
