import type * as React from 'react';

import { cn } from '@src/utils/cn';

/**
 * Renders an accessible label associated with controls.
 *
 * https://ui.shadcn.com/docs/components/label
 */
function Label({
  className,
  ...props
}: React.ComponentProps<'label'>): React.ReactElement {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- htmlFor is passed via props by consumers (e.g. FormLabel)
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
