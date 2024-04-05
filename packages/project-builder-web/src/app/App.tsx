import { ConfirmDialog } from '@halfdomelabs/ui-components';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';

import { ClientVersionGate } from './components/ClientVersionGate';
import { ProjectChooserGate } from './components/ProjectChooserGate';
import { ProjectConfigGate } from './components/ProjectConfigGate';
import { RefIssueDialog } from '@src/components/RefIssueDialog/RefIssueDialog';
import { ErrorBoundary } from 'src/components/ErrorBoundary/ErrorBoundary';

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <ClientVersionGate>
        <ProjectChooserGate>
          <ProjectConfigGate>
            <Outlet />
            <RefIssueDialog />
          </ProjectConfigGate>
        </ProjectChooserGate>
        <Toaster />
        <ConfirmDialog />
      </ClientVersionGate>
    </ErrorBoundary>
  );
}

export default App;
