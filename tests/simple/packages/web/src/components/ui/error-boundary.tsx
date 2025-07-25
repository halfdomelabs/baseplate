import type { ReactElement } from 'react';

import { useContext } from 'react';
import {
  ErrorBoundaryContext,
  ErrorBoundary as ReactErrorBoundary,
} from 'react-error-boundary';

import { logError } from '@src/services/error-logger';

import { Button } from './button';
import { ErrorDisplay } from './error-display';

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
}): ReactElement {
  const {
    resetErrorBoundary,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    error,
  }: {
    resetErrorBoundary: () => void;
    error: unknown;
  } = useContext(ErrorBoundaryContext) ?? {
    resetErrorBoundary: () => {
      /* no-op */
    },
    error: undefined,
  };
  return (
    <ErrorDisplay
      error={error}
      actions={<Button onClick={resetErrorBoundary}>{resetButtonLabel}</Button>}
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
}: ErrorBoundaryProps): ReactElement {
  return (
    <ReactErrorBoundary
      fallback={
        <ErrorBoundaryFallback
          resetButtonLabel={resetButtonLabel ?? 'Reload Page'}
        />
      }
      onError={(err) => logError(err)}
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
