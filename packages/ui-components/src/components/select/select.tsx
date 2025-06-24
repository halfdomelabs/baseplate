'use client';

import type * as React from 'react';

import {
  ScrollArea as ScrollAreaPrimitive,
  Select as SelectPrimitive,
} from 'radix-ui';
import { MdCheck, MdUnfoldMore } from 'react-icons/md';

import {
  selectCheckVariants,
  selectContentVariants,
  selectItemVariants,
  selectTriggerVariants,
} from '#src/styles/index.js';
import { cn } from '#src/utils/index.js';

import { ScrollBar } from '../scroll-area/scroll-area.js';

/**
 * Select component
 *
 * - Adapted styles to make full width to match input styles
 * - Added max height to the content
 * - Use scroll area to make the content scrollable rather than buttons
 *
 * https://ui.shadcn.com/docs/components/select
 */
function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>): React.ReactElement {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>): React.ReactElement {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>): React.ReactElement {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
}): React.ReactElement {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(selectTriggerVariants(), className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <MdUnfoldMore className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}
interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  maxHeight?: string;
}

function SelectContent({
  className,
  children,
  position = 'popper',
  maxHeight = '320px',
  ...props
}: SelectContentProps): React.ReactElement {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          selectContentVariants({
            popper: position === 'popper' ? 'active' : 'none',
          }),
          className,
        )}
        position={position}
        {...props}
      >
        <ScrollAreaPrimitive.Root
          type="auto"
          className="relative overflow-hidden"
        >
          <SelectPrimitive.Viewport asChild>
            <ScrollAreaPrimitive.Viewport
              className={cn(
                'h-full w-full rounded-[inherit] p-1',
                position === 'popper'
                  ? 'max-h-[min(var(--max-popper-height),var(--radix-select-content-available-height))] w-full min-w-(--radix-select-trigger-width)'
                  : 'max-h-(--max-popper-height)',
              )}
              style={
                {
                  '--max-popper-height': maxHeight,
                  // Resolves React warning: https://github.com/radix-ui/primitives/issues/2059
                  overflowY: undefined,
                } as Record<string, string | undefined>
              }
            >
              {children}
            </ScrollAreaPrimitive.Viewport>
          </SelectPrimitive.Viewport>
          <ScrollBar />
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>): React.ReactElement {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>): React.ReactElement {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(selectItemVariants({ withFocus: 'highlight' }), className)}
      {...props}
    >
      <span className={selectCheckVariants()}>
        <SelectPrimitive.ItemIndicator>
          <MdCheck className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>): React.ReactElement {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
