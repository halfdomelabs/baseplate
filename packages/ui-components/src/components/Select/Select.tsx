import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as React from 'react';
import { RxCaretSort, RxCheck } from 'react-icons/rx';

import { ScrollArea } from '../ScrollArea/ScrollArea';
import {
  inputVariants,
  selectCheckVariants,
  selectContentVariants,
  selectItemVariants,
} from '@src/styles';
import { cn } from '@src/utils';

/* eslint-disable react/prop-types */

/**
 * Select component
 *
 * https://ui.shadcn.com/docs/components/select
 */

const SelectRoot = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      inputVariants(),
      'group items-center justify-between data-[placeholder]:text-muted-foreground',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild className="text-foreground">
      <RxCaretSort className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  maxHeight?: string;
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(
  (
    { className, children, position = 'popper', maxHeight = '320px', ...props },
    ref,
  ) => {
    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
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
                    ? 'max-h-[min(var(--max-popper-height),var(--radix-select-content-available-height))] w-full min-w-[var(--radix-select-trigger-width)]'
                    : 'max-h-[var(--max-popper-height)]',
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
            <ScrollArea.ScrollBar />
            <ScrollAreaPrimitive.Corner />
          </ScrollAreaPrimitive.Root>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  },
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(selectItemVariants(), className)}
    {...props}
  >
    <span className={selectCheckVariants()}>
      <SelectPrimitive.ItemIndicator>
        <RxCheck className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export const Select = Object.assign(SelectRoot, {
  Group: SelectGroup,
  Value: SelectValue,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Label: SelectLabel,
  Item: SelectItem,
  Separator: SelectSeparator,
});
