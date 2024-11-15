import type { ErrorHandlerValue } from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';

import { ErrorHandlerContext } from '@halfdomelabs/project-builder-lib/web';
import { ConfirmDialog, Toaster, Tooltip } from '@halfdomelabs/ui-components';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from 'src/components/ErrorBoundary/ErrorBoundary';

import { BlockerDialog } from '@src/components';
import { RefIssueDialog } from '@src/components/RefIssueDialog/RefIssueDialog';
import { formatError, logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';

import { ClientVersionGate } from './components/ClientVersionGate';
import { ProjectChooserGate } from './components/ProjectChooserGate';
import { ProjectDefinitionGate } from './components/ProjectDefinitionGate';

function App(): React.JSX.Element {
  const errorHandler: ErrorHandlerValue = useMemo(
    () => ({
      formatError,
      logAndFormatError,
      logError,
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
