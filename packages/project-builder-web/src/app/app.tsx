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

import { ClientVersionProvider } from './client-version-provider/client-version-provider.js';
import { ProjectDefinitionProvider } from './project-definition-provider/project-definition-provider.js';
import { ProjectSelectorGate } from './project-selector-gate/project-selector-gate.js';

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
