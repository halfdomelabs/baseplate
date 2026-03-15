import type React from 'react';

import { cn } from '#src/utils/index.js';

/**
 * A spinner component that indicates a loading state.
 *
 * @param props - Standard div element props, including optional `className` for custom styling.
 * @returns A rotating circular spinner element with `role="status"`.
 */
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
