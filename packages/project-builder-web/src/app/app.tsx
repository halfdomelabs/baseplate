import type { ErrorHandlerValue } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import {
  ErrorHandlerContext,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  ConfirmDialog,
  Toaster,
  TooltipProvider,
} from '@baseplate-dev/ui-components';
import { RouterProvider } from '@tanstack/react-router';
import { useMemo } from 'react';

import { ErrorBoundary, RefIssueDialog } from '#src/components/index.js';
import { router } from '#src/router.js';
import {
  formatError,
  logAndFormatError,
} from '#src/services/error-formatter.js';
import { logError } from '#src/services/error-logger.js';

import { ClientVersionProvider } from './client-version-provider/client-version-provider.js';
import { ProjectDefinitionProvider } from './project-definition-provider/project-definition-provider.js';
import { ProjectSelectorGate } from './project-selector-gate/project-selector-gate.js';

function AppRoutes(): React.ReactElement {
  const { definition: projectDefinition, schemaParserContext } =
    useProjectDefinition();
  return (
    <RouterProvider
      router={router}
      context={{ projectDefinition, schemaParserContext }}
    />
  );
}

export function App(): React.ReactElement {
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
                <AppRoutes />
                <RefIssueDialog />
              </ProjectDefinitionProvider>
            </ProjectSelectorGate>
          </ClientVersionProvider>
          <Toaster />
          <ConfirmDialog />
        </TooltipProvider>
      </ErrorHandlerContext.Provider>
    </ErrorBoundary>
  );
}
