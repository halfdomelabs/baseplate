// @ts-nocheck

import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '$cn';
import { cva } from 'class-variance-authority';

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border border-tone-border bg-tone px-2.5 py-2 text-left text-sm text-tone-foreground has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'tone-default',
        error: 'tone-error',
        success: 'tone-success',
        warning: 'tone-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Displays a callout for user attention.
 *
 * ShadCN changes:
 * - Variants are the `tone-*` utilities (default/error/success/warning) rather
 *   than upstream's card-background default/destructive pair, so an alert
 *   carries a full status palette its children inherit
 * - Links use the shared `inline-link` treatment
 *
 * https://ui.shadcn.com/docs/components/alert
 */
function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof alertVariants>): React.ReactElement {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-medium group-has-[>svg]/alert:col-start-2 [&_a]:inline-link',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm text-balance text-tone-muted-foreground md:text-pretty [&_a]:inline-link [&_p:not(:last-child)]:mb-4',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Corner region for an alert's dismiss or retry control. `Alert` reserves the
 * right padding for it only when one is present.
 */
function AlertAction({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="alert-action"
      className={cn('absolute top-2 right-2', className)}
      {...props}
    />
  );
}

export { Alert, AlertAction, AlertDescription, AlertTitle };
