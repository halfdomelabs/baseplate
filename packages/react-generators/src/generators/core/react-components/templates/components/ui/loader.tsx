// @ts-nocheck

import type React from 'react';

import { cn } from '$cn';
import { useEffect, useState } from 'react';

interface LoaderProps {
  className?: string;
  delay?: number;
}

/**
 * Loader component that displays a 3-dot loading animation.
 * Only shows after the specified delay (default: 300ms) to prevent flashing for quick operations.
 */
function Loader({ className, delay = 300 }: LoaderProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay]);

  if (!isVisible) {
    return (
      <div
        className={cn('flex h-full items-center justify-center', className)}
      />
    );
  }

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
