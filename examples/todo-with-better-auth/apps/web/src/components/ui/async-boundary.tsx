import type { ReactElement } from 'react';

import { Suspense } from 'react';

import { ErrorBoundary } from './error-boundary';
import { Loader } from './loader';

interface AsyncBoundaryProps {
  /** Content that may suspend or throw */
  children: React.ReactNode;
  /** Custom loading fallback (defaults to Loader) */
  fallback?: React.ReactNode;
  /** Loader delay in ms (default: 300) */
  loaderDelay?: number;
  /** Additional className for the loader */
  className?: string;
}

/**
 * Combines Suspense and ErrorBoundary for async data fetching.
 * Use for sub-route granularity where different sections can load/error independently.
 *
 * @example
 * ```tsx
 * <AsyncBoundary>
 *   <ComponentUsingUseSuspenseQuery />
 * </AsyncBoundary>
 * ```
 */
export function AsyncBoundary({
  children,
  fallback,
  loaderDelay = 300,
  className,
}: AsyncBoundaryProps): ReactElement {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          fallback ?? <Loader delay={loaderDelay} className={className} />
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
