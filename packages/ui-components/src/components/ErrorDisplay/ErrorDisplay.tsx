import { clsx } from 'clsx';
import { MdOutlineErrorOutline } from 'react-icons/md';
import { COMPONENT_STRINGS } from '@src/constants/strings.js';

interface ErrorDisplayProps {
  /**
   * Optional class name to be applied to the loader or error div
   */
  className?: string;
  /**
   * Header to be displayed (if not passed, a generic error header will be displayed)
   */
  header?: string;
  /**
   * Error to be displayed (if a string is passed, it will be displayed as-is, otherwise a generic error message will be displayed)
   */
  error?: unknown;
  /**
   * Optional actions to be displayed below the error message
   */
  actions?: React.ReactNode;
}

export function ErrorDisplay({
  className,
  header,
  error,
  actions,
}: ErrorDisplayProps): JSX.Element {
  return (
    <div className={clsx('flex h-full items-center justify-center', className)}>
      <div className="flex max-w-xl flex-col items-center space-y-4 text-center">
        <div>
          <MdOutlineErrorOutline className="h-20 w-20 text-foreground-300 dark:text-foreground-700" />
        </div>
        <h1>{header || COMPONENT_STRINGS.genericErrorHeader}</h1>
        <p className="text-base">
          {typeof error === 'string'
            ? error
            : COMPONENT_STRINGS.genericErrorContent}
        </p>
        {actions}
      </div>
    </div>
  );
}
