import type { ErrorHandlerValue } from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';

import { ErrorHandlerContext } from '@halfdomelabs/project-builder-lib/web';
import { ConfirmDialog, Toaster, Tooltip } from '@halfdomelabs/ui-components';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';

import { BlockerDialog, ErrorBoundary, RefIssueDialog } from '@src/components';
import { formatError, logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';

import { ClientVersionProvider } from './ClientVersionProvider/ClientVersionProvider';
import { ProjectDefinitionProvider } from './ProjectDefinitionProvider/ProjectDefinitionProvider';
import { ProjectSelectorGate } from './ProjectSelectorGate/ProjectSelectorGate';

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
          <ClientVersionProvider>
            <ProjectSelectorGate>
              <ProjectDefinitionProvider>
                <Outlet />
                <RefIssueDialog />
              </ProjectDefinitionProvider>
            </ProjectSelectorGate>
          </ClientVersionProvider>
          <Toaster />
          <ConfirmDialog />
          <BlockerDialog />
        </Tooltip.Provider>
      </ErrorHandlerContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
