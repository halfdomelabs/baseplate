// @ts-nocheck

import type React from 'react';

import { cn } from '$cn';

interface LoaderProps {
  className?: string;
}

/**
 * Loader component that displays a 3-dot loading animation.
 */
function Loader({ className }: LoaderProps): React.ReactElement {
  return (
    <div
      className={cn('flex h-full items-center justify-center', className)}
      role="progressbar"
    >
      <div className="flex items-center space-x-2">
        <div className="size-3 animate-pulse rounded-full bg-muted-foreground" />
        <div className="size-3 animate-pulse rounded-full bg-muted-foreground delay-300" />
        <div className="size-3 animate-pulse rounded-full bg-muted-foreground delay-[600ms]" />
      </div>
    </div>
  );
}

export { Loader };
