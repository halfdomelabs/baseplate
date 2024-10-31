import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@src/utils';

 

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
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
const AlertRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
AlertRoot.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  // eslint-disable-next-line jsx-a11y/heading-has-content
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export const Alert = Object.assign(AlertRoot, {
  Title: AlertTitle,
  Description: AlertDescription,
});
