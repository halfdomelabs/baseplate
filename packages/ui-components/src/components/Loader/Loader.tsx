import type React from 'react';

import { cn } from '@src/utils';

interface LoaderProps {
  className?: string;
}

/**
 * Loader component that displays a 3-dot loading animation.
 */
export function Loader({ className }: LoaderProps): React.JSX.Element {
  return (
    <div className={cn('flex h-full items-center justify-center', className)}>
      <div className="flex items-center space-x-2">
        <div className="size-3 animate-pulse rounded-full bg-muted-foreground" />
        <div
          className="size-3 animate-pulse rounded-full bg-muted-foreground"
          style={{ animationDelay: '300ms' }}
        />
        <div
          className="size-3 animate-pulse rounded-full bg-muted-foreground"
          style={{ animationDelay: '600ms' }}
        />
      </div>
    </div>
  );
}
