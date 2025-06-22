import type React from 'react';

import { Button, ErrorDisplay } from '@baseplate-dev/ui-components';
import { useContext } from 'react';
import {
  ErrorBoundaryContext,
  ErrorBoundary as ReactErrorBoundary,
} from 'react-error-boundary';

import { formatError } from '#src/services/error-formatter.js';
import { logError } from '#src/services/error-logger.js';
import { UserVisibleError } from '#src/utils/error.js';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
  /**
   * The label for the reset button (defaults to "Reload Page")
   */
  resetButtonLabel?: string;
  /**
   * Called when the user clicks the reset button.
   */
  onReset?: () => void;
}

function ErrorBoundaryFallback({
  resetButtonLabel,
}: {
  resetButtonLabel: string;
}): React.JSX.Element {
  const {
    resetErrorBoundary,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    error,
  }: {
    resetErrorBoundary: () => void;
    error: unknown;
  } = useContext(ErrorBoundaryContext) ?? {
    resetErrorBoundary: () => {
      /* dummy */
    },
    error: undefined,
  };
  const title = error instanceof UserVisibleError ? error.title : undefined;
  // If the error is a UserVisibleError, it is not likely recoverable.
  const isRecoverable = !(error instanceof UserVisibleError);
  const errorString = formatError(error, '');
  return (
    <ErrorDisplay
      header={title}
      error={errorString}
      actions={
        isRecoverable && (
          <Button onClick={resetErrorBoundary}>{resetButtonLabel}</Button>
        )
      }
    />
  );
}

/**
 * A wrapper for React Error Boundary that displays a generic error message and a button to reset the error state.
 */
export function ErrorBoundary({
  children,
  resetButtonLabel,
  onReset,
}: ErrorBoundaryProps): React.JSX.Element {
  return (
    <ReactErrorBoundary
      fallback={
        <ErrorBoundaryFallback
          resetButtonLabel={resetButtonLabel ?? 'Reload Page'}
        />
      }
      onError={(err) => {
        logError(err);
      }}
      onReset={() => {
        if (onReset) {
          onReset();
        } else {
          globalThis.location.reload();
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
