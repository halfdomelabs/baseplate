// @ts-nocheck

'use client';

import type React from 'react';

import { buttonVariants } from '$stylesButton';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * A toaster component that displays toast notifications.
 *
 * Adapted from https://ui.shadcn.com/docs/components/sonner
 */
const Toaster = ({ ...props }: ToasterProps): React.ReactElement => (
  <Sonner
    className="toaster group"
    position="top-center"
    duration={3000}
    closeButton
    toastOptions={{
      unstyled: true,
      classNames: {
        success:
          'group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success',
        error:
          'group-[.toaster]:bg-error group-[.toaster]:text-error-foreground group-[.toaster]:border-error',
        warning:
          'group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground group-[.toaster]:border-warning',
        default: 'bg-background text-foreground',
        toast:
          'group toast group-[.toaster]:shadow-lg p-4 rounded-lg flex items-center text-sm gap-1.5 w-(--width)',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton: buttonVariants({
          size: 'sm',
        }),
        cancelButton: buttonVariants({
          size: 'sm',
          variant: 'secondary',
        }),
      },
    }}
    {...props}
  />
);

export { Toaster };
