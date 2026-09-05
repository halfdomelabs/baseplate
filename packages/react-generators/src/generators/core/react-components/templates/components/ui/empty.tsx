// @ts-nocheck

import type { VariantProps } from 'class-variance-authority';

import { cn } from '$cn';
import { cva } from 'class-variance-authority';

/**
 * A composable empty state component.
 *
 * ShadCN changes:
 * - Description links use the shared `inline-link` treatment
 *
 * https://ui.shadcn.com/docs/components/base/empty
 */
function Empty({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12',
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        'flex max-w-sm flex-col items-center gap-2 text-center',
        className,
      )}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof emptyMediaVariants>): React.ReactElement {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="empty-title"
      className={cn('text-lg font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.ReactElement {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        '[&>a]:inline-link text-sm/relaxed text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance',
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  emptyMediaVariants,
  EmptyTitle,
};
