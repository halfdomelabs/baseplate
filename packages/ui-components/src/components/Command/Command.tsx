import type { DialogProps } from '@radix-ui/react-dialog';
import type * as React from 'react';

import { Command as CommandPrimitive } from 'cmdk';
import { MdSearch } from 'react-icons/md';

import { cn } from '@src/utils';

import { Dialog } from '../Dialog/Dialog';

/**
 * Fast, composable, unstyled command menu for React.
 *
 * https://ui.shadcn.com/docs/components/command
 */
function CommandRoot({
  className,
  ...props
}: React.ComponentPropsWithoutRef<
  typeof CommandPrimitive
>): React.ReactElement {
  return (
    <CommandPrimitive
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
        className,
      )}
      {...props}
    />
  );
}

CommandRoot.displayName = CommandPrimitive.displayName;

function CommandDialog({
  children,
  ...props
}: DialogProps): React.ReactElement {
  return (
    <Dialog {...props}>
      <Dialog.Content className="overflow-hidden p-0 shadow-lg">
        <CommandRoot className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5">
          {children}
        </CommandRoot>
      </Dialog.Content>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentPropsWithRef<
  typeof CommandPrimitive.Input
>): React.ReactElement {
  return (
    // eslint-disable-next-line react/no-unknown-property
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <MdSearch className="mr-2 size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

CommandInput.displayName = CommandPrimitive.Input.displayName;

function CommandList({
  className,
  ...props
}: React.ComponentPropsWithRef<
  typeof CommandPrimitive.List
>): React.ReactElement {
  return (
    <CommandPrimitive.List
      className={cn(
        'max-h-[300px] overflow-y-auto overflow-x-hidden',
        className,
      )}
      {...props}
    />
  );
}

CommandList.displayName = CommandPrimitive.List.displayName;

function CommandEmpty({
  className,
  ...props
}: React.ComponentPropsWithRef<
  typeof CommandPrimitive.Empty
>): React.ReactElement {
  return (
    <CommandPrimitive.Empty
      className={cn('py-6 text-center text-sm', className)}
      {...props}
    />
  );
}

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

// Temporarily exporting to allow MultiCombobox typings to work
export function CommandGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.Group
>): React.ReactElement {
  return (
    <CommandPrimitive.Group
      className={cn(
        'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

CommandGroup.displayName = CommandPrimitive.Group.displayName;

function CommandSeparator({
  className,
  ...props
}: React.ComponentPropsWithRef<
  typeof CommandPrimitive.Separator
>): React.ReactElement {
  return (
    <CommandPrimitive.Separator
      className={cn('-mx-1 h-px bg-border', className)}
      {...props}
    />
  );
}

CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

function CommandItem({
  className,
  ...props
}: React.ComponentPropsWithRef<
  typeof CommandPrimitive.Item
>): React.ReactElement {
  return (
    <CommandPrimitive.Item
      className={cn(
        'relative flex cursor-default select-none items-center rounded-xs px-2 py-1.5 text-sm outline-hidden aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

CommandItem.displayName = CommandPrimitive.Item.displayName;

function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

CommandShortcut.displayName = 'CommandShortcut';

export const Command = Object.assign(CommandRoot, {
  Dialog: CommandDialog,
  Input: CommandInput,
  List: CommandList,
  Empty: CommandEmpty,
  Group: CommandGroup,
  Item: CommandItem,
  Shortcut: CommandShortcut,
  Separator: CommandSeparator,
});
