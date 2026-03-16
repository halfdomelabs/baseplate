import type React from 'react';

import { cn } from '@src/utils/cn';

/**
 * A spinner component that indicates a loading state.
 *
 * - Use CSS only icon
 *
 * https://ui.shadcn.com/docs/components/base/spinner
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
