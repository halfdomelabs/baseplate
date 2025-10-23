'use client';

import type * as React from 'react';

import { Label as LabelPrimitive } from 'radix-ui';

import { cn } from '@src/utils/cn';

/**
 * Renders an accessible label associated with controls.
 *
 * https://ui.shadcn.com/docs/components/label
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>): React.ReactElement {
  return (
    <LabelPrimitive.Root
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
