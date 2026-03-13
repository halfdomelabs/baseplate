'use client';

import type * as React from 'react';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { MdClose } from 'react-icons/md';

import { cn } from '#src/utils/index.js';

import { Button } from '../button/button.js';

/**
 * A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.
 *
 * ShadCN changes:
 * - Added custom width property to specify the width of the dialog (sm, md, lg, xl, none).
 * - Added max-h-[90vh] overflow-y-auto to ensure the dialog is scrollable for long content.
 *
 * https://ui.shadcn.com/docs/components/dialog
 */
function Dialog({ ...props }: DialogPrimitive.Root.Props): React.ReactElement {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: DialogPrimitive.Trigger.Props): React.ReactElement {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: DialogPrimitive.Portal.Props): React.ReactElement {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: DialogPrimitive.Close.Props): React.ReactElement {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props): React.ReactElement {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

export type DialogWidth = 'sm' | 'md' | 'lg' | 'xl' | 'none';

function DialogContent({
  className,
  children,
  width = 'md',
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  width?: DialogWidth;
  showCloseButton?: boolean;
}): React.ReactElement {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid max-h-[90vh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          width === 'sm' && 'sm:max-w-sm',
          width === 'md' && 'sm:max-w-lg',
          width === 'lg' && 'sm:max-w-4xl',
          width === 'xl' && 'sm:max-w-7xl',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <MdClose />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  children,
  showCloseButton = false,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}): React.ReactElement {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props): React.ReactElement {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-base leading-none font-medium', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props): React.ReactElement {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
