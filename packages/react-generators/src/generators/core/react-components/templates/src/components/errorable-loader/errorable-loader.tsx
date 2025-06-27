// @ts-nocheck

import type React from 'react';

import { ErrorDisplay } from '../error-display/error-display.js';
import { Loader } from '../loader/loader.js';

interface ErrorableLoaderProps {
  /**
   * Optional class name to be applied to the loader or error div
   */
  className?: string;
  /**
   * Error to be displayed (if a string is passed, it will be displayed as-is, otherwise a generic error message will be displayed)
   */
  error?: unknown;
  /**
   * Header to be displayed (if not passed, a generic error header will be displayed)
   */
  header?: React.ReactNode;
  /**
   * Optional actions to be displayed below the error message
   */
  actions?: React.ReactNode;
}

/**
 * Displays a loader component that if an error is passed, it will display an error message instead.
 */
function ErrorableLoader({
  className,
  error,
  header,
  actions,
}: ErrorableLoaderProps): React.ReactElement {
  if (!error) {
    return <Loader className={className} />;
  }
  return <ErrorDisplay header={header} error={error} actions={actions} />;
}

export { ErrorableLoader };
