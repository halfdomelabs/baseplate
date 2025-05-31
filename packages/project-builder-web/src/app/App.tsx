import type { ErrorHandlerValue } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import { ErrorHandlerContext } from '@baseplate-dev/project-builder-lib/web';
import {
  ConfirmDialog,
  Toaster,
  TooltipProvider,
} from '@baseplate-dev/ui-components';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';

import {
  BlockerDialog,
  ErrorBoundary,
  RefIssueDialog,
} from '#src/components/index.js';
import {
  formatError,
  logAndFormatError,
} from '#src/services/error-formatter.js';
import { logError } from '#src/services/error-logger.js';

import { ClientVersionProvider } from './ClientVersionProvider/ClientVersionProvider.js';
import { ProjectDefinitionProvider } from './ProjectDefinitionProvider/ProjectDefinitionProvider.js';
import { ProjectSelectorGate } from './ProjectSelectorGate/ProjectSelectorGate.js';

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
        <TooltipProvider>
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
        </TooltipProvider>
      </ErrorHandlerContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
