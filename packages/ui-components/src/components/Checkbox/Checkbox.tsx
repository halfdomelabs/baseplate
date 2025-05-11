'use client';

import type * as React from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { MdCheck } from 'react-icons/md';

import { cn } from '@src/utils';

/**
 * A control that allows the user to toggle between checked and not checked.
 *
 * https://ui.shadcn.com/docs/components/checkbox
 */

function Checkbox({
  className,
  ...props
}: React.ComponentPropsWithRef<
  typeof CheckboxPrimitive.Root
>): React.ReactElement {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer h-4 w-4 shrink-0 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
      >
        <MdCheck className="size-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
