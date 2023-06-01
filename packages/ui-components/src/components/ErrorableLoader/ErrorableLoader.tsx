import { clsx } from 'clsx';
import { MdOutlineErrorOutline } from 'react-icons/md';
import { COMPONENT_STRINGS } from '@src/constants/strings.js';
import { Loader } from '../Loader/Loader.js';

interface ErrorableLoaderProps {
  /**
   * Optional class name to be applied to the loader or error div
   */
  className?: string;
  /**
   * Error to be displayed if any
   */
  error?: Error | string | null;
}

/**
 * Renders a loader component that can display an error message.
 */
export function ErrorableLoader({
  className,
  error,
}: ErrorableLoaderProps): JSX.Element {
  if (!error) {
    return <Loader className={className} />;
  }
  return (
    <div className={clsx('flex h-full items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-4">
        <div>
          <MdOutlineErrorOutline className="h-20 w-20 text-secondary-300 dark:text-secondary-700" />
        </div>
        <h1>{COMPONENT_STRINGS.loadErrorHeader}</h1>
        <p>
          {error instanceof Error ? COMPONENT_STRINGS.loadErrorContent : error}
        </p>
      </div>
    </div>
  );
}
