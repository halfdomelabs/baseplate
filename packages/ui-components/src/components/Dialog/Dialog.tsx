'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { clsx } from 'clsx';
import * as React from 'react';
import { HiXMark } from 'react-icons/hi2';

const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogPortal({
  className,
  ...props
}: DialogPrimitive.DialogPortalProps): JSX.Element {
  return <DialogPrimitive.Portal className={clsx(className)} {...props} />;
}
DialogPortal.displayName = DialogPrimitive.Portal.displayName;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={clsx(
      'bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 backdrop-blur-sm',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    className?: string;
  }
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={clsx(
        'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg sm:rounded-lg md:w-full',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="ring-offset-background data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <HiXMark className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
}): JSX.Element {
  return (
    <div
      className={clsx(
        'flex flex-col space-y-1.5 text-center sm:text-left',
        className
      )}
      {...props}
    />
  );
}
DialogHeader.displayName = 'DialogHeader';

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
}): JSX.Element {
  return (
    <div
      className={clsx(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={clsx(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={clsx('text-muted-foreground text-sm', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogBody = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & {
    className?: string;
  }
>(({ children, className, ...props }, ref) => (
  <div ref={ref} {...props} className={clsx('py-4', className)}>
    {children}
  </div>
));

function getDialogSizeClass(size: DialogSize): string {
  return clsx(
    size === 'sm' && 'w-72',
    size === 'md' && 'w-72 md:w-[30rem]',
    size === 'lg' && 'w-72 md:w-[40rem]',
    size === 'xl' && 'w-72 md:w-[50rem]'
  );
}

/**
 * Represents the size options for the Dialog component.
 */
type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DialogProps extends Omit<DialogPrimitive.DialogProps, 'open'> {
  /**
   * Additional CSS class name for the component.
   */
  className?: string;
  /**
   * The content to be rendered inside the Dialog.
   */
  children: React.ReactNode;
  /**
   * state of the dialog window
   */
  isOpen?: boolean;
  /**
   * The size of the Dialog.
   */
  size?: DialogSize;
  /**
   * The element triggering the dialog box
   */
  trigger?: React.ReactNode;
}

export function Dialog({
  className,
  children,
  trigger,
  size = 'md',
  isOpen,
  onOpenChange,
  ...rest
}: DialogProps): JSX.Element {
  return (
    <DialogPrimitive.Root {...rest} open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={clsx(
          'max-h-full overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-background-900',
          getDialogSizeClass(size),
          className
        )}
      >
        {children}
      </DialogContent>
    </DialogPrimitive.Root>
  );
}

Dialog.Header = DialogHeader;
Dialog.Body = DialogBody;
Dialog.Close = DialogClose;
Dialog.Footer = DialogFooter;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
