// @ts-nocheck

'use client';

import type * as React from 'react';

import { cn } from '$cn';
import { Separator as SeparatorPrimitive } from 'radix-ui';

/**
 * Visually or semantically separates content.
 *
 * https://ui.shadcn.com/docs/components/separator
 */
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>): React.ReactElement {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
