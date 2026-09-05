// @ts-nocheck

'use client';

import type React from 'react';

import { buttonVariants } from '$stylesButton';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * A toaster component that displays toast notifications.
 *
 * ShadCN changes:
 * - Status toasts use the `tone-*` utilities rather than sonner's own colour
 *   set. Not swept against upstream, since ENG-1310 replaces sonner with Base
 *   UI Toast behind this facade.
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
