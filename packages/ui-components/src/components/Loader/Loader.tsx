import { clsx } from 'clsx';

interface LoaderProps {
  className?: string;
}

/**
 * Loader component that displays a loading animation.
 */
export function Loader({ className }: LoaderProps): JSX.Element {
  return (
    <div className={clsx('flex h-full items-center justify-center', className)}>
      <div className="flex items-center space-x-2">
        <div className="h-3 w-3 animate-pulse rounded-full bg-gray-400" />
        <div
          className="h-3 w-3 animate-pulse rounded-full bg-gray-400"
          style={{ animationDelay: '300ms' }}
        />
        <div
          className="h-3 w-3 animate-pulse rounded-full bg-gray-400"
          style={{ animationDelay: '600ms' }}
        />
      </div>
    </div>
  );
}
