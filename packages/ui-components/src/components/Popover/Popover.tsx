'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import React from 'react';

import { cn } from '@src/utils';

/**
 * Displays rich content in a portal, triggered by a button.
 *
 * https://ui.shadcn.com/docs/components/popover
 */

const PopoverRoot = (
  props: PopoverPrimitive.PopoverProps,
): React.JSX.Element => <PopoverPrimitive.Root {...props} />;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  width?: 'default' | 'none';
  padding?: 'default' | 'none';
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      align = 'center',
      sideOffset = 4,
      width = 'default',
      padding = 'default',
      ...props
    },
    ref,
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          width === 'none' ? '' : 'w-72',
          padding === 'none' ? 'p-0' : 'p-4',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ),
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export const Popover = Object.assign(PopoverRoot, {
  Anchor: PopoverAnchor,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
});
