import type React from 'react';

import { cn } from '#src/utils/cn.js';

/**
 * Displays a list of buttons aligned next to one another.
 * Styles all direct Button children with appropriate group styling.
 */
export function ButtonGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn(
        'inline-flex rounded-md shadow-sm',
        '[&>*:not(:first-child)]:rounded-l-none',
        '[&>*:not(:last-child)]:rounded-r-none',
        '[&>*:not(:last-child)]:border-r-0',
        '[&>*]:focus-visible:z-10',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
