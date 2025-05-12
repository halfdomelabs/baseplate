import type * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@src/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground [&>svg]:text-foreground',
        error:
          'border-error-foreground/40 bg-error text-error-foreground dark:border-error [&>svg]:text-error-foreground',
        success:
          'border-success-foreground/40 bg-success text-success-foreground dark:border-success [&>svg]:text-success-foreground',
        warning:
          'border-warning-foreground/40 bg-warning text-warning-foreground dark:border-warning [&>svg]:text-warning-foreground',
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
 * https://ui.shadcn.com/docs/components/alert
 */
function AlertRoot({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>): React.ReactElement {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

AlertRoot.displayName = 'Alert';

function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.ReactElement {
  return (
    // eslint-disable-next-line jsx-a11y/heading-has-content
    <h5
      className={cn('mb-1 leading-none font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}

export const Alert = Object.assign(AlertRoot, {
  Title: AlertTitle,
  Description: AlertDescription,
});
