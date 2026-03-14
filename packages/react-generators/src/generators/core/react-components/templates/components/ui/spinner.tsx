// @ts-nocheck

import type React from 'react';

import { cn } from '$cn';

function Spinner({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
