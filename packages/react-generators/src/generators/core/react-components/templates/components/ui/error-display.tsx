// @ts-nocheck

import { cn } from '$cn';
import React from 'react';
import { MdOutlineErrorOutline } from 'react-icons/md';

interface ErrorDisplayProps {
  /**
   * Optional class name to be applied to the loader or error div
   */
  className?: string;
  /**
   * Header to be displayed (if not passed, a generic error header will be displayed)
   */
  header?: React.ReactNode;
  /**
   * Error to be displayed (if a string is passed, it will be displayed as-is, otherwise a generic error message will be displayed)
   */
  error?: unknown;
  /**
   * Optional actions to be displayed below the error message
   */
  actions?: React.ReactNode;
}

/**
 * Displays a generic error state with a header and error message.
 */
function ErrorDisplay({
  className,
  header,
  error,
  actions,
}: ErrorDisplayProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center',
        className,
      )}
      role="alert"
    >
      <div className="flex max-w-xl flex-col items-center space-y-4 text-center">
        <div>
          <MdOutlineErrorOutline className="size-20 text-muted-foreground" />
        </div>
        <h1>{header ?? 'Sorry, something went wrong'}</h1>
        <p>
          {typeof error === 'string' || React.isValidElement(error)
            ? error
            : 'We encountered an error showing this page.'}
        </p>
        {actions}
      </div>
    </div>
  );
}

export { ErrorDisplay };
