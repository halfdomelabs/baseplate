import type React from 'react';

import { cn } from '../../utils/cn.js';

/**
 * A spinner component that indicates a loading state.
 *
 * ShadCN changes:
 * - Drawn with a bordered div rather than a spinning icon, so it needs no icon
 *   dependency and takes its colour from `currentColor`
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
