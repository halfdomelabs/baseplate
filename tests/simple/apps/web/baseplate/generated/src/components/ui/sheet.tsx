'use client';

import type * as React from 'react';
import type { ReactElement } from 'react';

import { Dialog as SheetPrimitive } from 'radix-ui';
import { MdClose } from 'react-icons/md';

import { cn } from '@src/utils/cn';

/**
 * React component that overlays a sheet on top of the current page.
 *
 * ShadCN changes:
 * - Wrap dialog content in an overlay to allow scrolling within other components e.g. combobox. (https://github.com/radix-ui/primitives/issues/3353#issuecomment-2664085003)
 *
 * https://ui.shadcn.com/docs/components/sheet
 */
function Sheet({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>): ReactElement {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>): ReactElement {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>): ReactElement {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>): ReactElement {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>): ReactElement {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
}): ReactElement {
  return (
    <SheetPortal>
      <SheetOverlay>
        <SheetPrimitive.Content
          data-slot="sheet-content"
          className={cn(
            'fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500',
            side === 'right' &&
              'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
            side === 'left' &&
              'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
            side === 'top' &&
              'inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
            side === 'bottom' &&
              'inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            className,
          )}
          {...props}
        >
          {children}
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
            <MdClose className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetOverlay>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  );
}

function SheetFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>): ReactElement {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>): ReactElement {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
