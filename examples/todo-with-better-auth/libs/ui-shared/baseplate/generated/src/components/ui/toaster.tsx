'use client';

import type React from 'react';

import { Toaster as Sonner } from 'sonner';

import { buttonVariants } from '../../styles/button.js';

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
          'group-[.toaster]:tone-success group-[.toaster]:bg-tone group-[.toaster]:text-tone-foreground group-[.toaster]:border-tone-border',
        error:
          'group-[.toaster]:tone-error group-[.toaster]:bg-tone group-[.toaster]:text-tone-foreground group-[.toaster]:border-tone-border',
        warning:
          'group-[.toaster]:tone-warning group-[.toaster]:bg-tone group-[.toaster]:text-tone-foreground group-[.toaster]:border-tone-border',
        default: 'bg-background text-foreground',
        toast:
          'group toast group-[.toaster]:shadow-lg p-4 rounded-lg flex items-center text-sm gap-1.5 w-(--width)',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton: `ml-auto ${buttonVariants({
          size: 'sm',
        })}`,
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
