// @ts-nocheck

import type React from 'react';

import { cn } from '../../utils/cn.js';

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
        <div className="bg-muted-foreground size-3 animate-pulse rounded-full" />
        <div className="bg-muted-foreground size-3 animate-pulse rounded-full delay-300" />
        <div className="bg-muted-foreground size-3 animate-pulse rounded-full delay-[600ms]" />
      </div>
    </div>
  );
}

export { Loader };
