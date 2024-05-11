import { ConfirmDialog, Tooltip } from '@halfdomelabs/ui-components';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';

import { ClientVersionGate } from './components/ClientVersionGate';
import { ProjectChooserGate } from './components/ProjectChooserGate';
import { ProjectDefinitionGate } from './components/ProjectDefinitionGate';
import { BlockerDialog } from '@src/components';
import { RefIssueDialog } from '@src/components/RefIssueDialog/RefIssueDialog';
import { ErrorBoundary } from 'src/components/ErrorBoundary/ErrorBoundary';

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <Tooltip.Provider>
        <ClientVersionGate>
          <ProjectChooserGate>
            <ProjectDefinitionGate>
              <Outlet />
              <RefIssueDialog />
            </ProjectDefinitionGate>
          </ProjectChooserGate>
          <Toaster />
          <ConfirmDialog />
          <BlockerDialog />
        </ClientVersionGate>
      </Tooltip.Provider>
    </ErrorBoundary>
  );
}

export default App;
