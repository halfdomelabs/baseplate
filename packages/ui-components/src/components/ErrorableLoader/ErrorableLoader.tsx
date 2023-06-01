import { ErrorDisplay } from '../ErrorDisplay/ErrorDisplay.js';
import { Loader } from '../Loader/Loader.js';

interface ErrorableLoaderProps {
  /**
   * Optional class name to be applied to the loader or error div
   */
  className?: string;
  /**
   * Error to be displayed (if a string is passed, it will be displayed as-is, otherwise a generic error message will be displayed)
   */
  error?: unknown;
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
  return <ErrorDisplay error={error} />;
}
