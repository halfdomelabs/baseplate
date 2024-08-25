import {
  ErrorHandlerContext,
  ErrorHandlerValue,
} from '@halfdomelabs/project-builder-lib/web';
import { ConfirmDialog, Toaster, Tooltip } from '@halfdomelabs/ui-components';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';

import { ClientVersionGate } from './components/ClientVersionGate';
import { ProjectChooserGate } from './components/ProjectChooserGate';
import { ProjectDefinitionGate } from './components/ProjectDefinitionGate';
import { BlockerDialog } from '@src/components';
import { RefIssueDialog } from '@src/components/RefIssueDialog/RefIssueDialog';
import { formatError, logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';
import { ErrorBoundary } from 'src/components/ErrorBoundary/ErrorBoundary';

function App(): JSX.Element {
  const errorHandler: ErrorHandlerValue = useMemo(
    () => ({
      formatError: formatError,
      logAndFormatError: logAndFormatError,
      logError: logError,
    }),
    [],
  );
  return (
    <ErrorBoundary>
      <ErrorHandlerContext.Provider value={errorHandler}>
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
      </ErrorHandlerContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
