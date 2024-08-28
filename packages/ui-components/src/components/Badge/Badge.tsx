import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@src/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Displays a badge or a component that looks like a badge.
 *
 * https://ui.shadcn.com/docs/components/badge
 */

function Badge({
  className,
  variant,
  ...props
}: BadgeProps): React.JSX.Element {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

interface BadgeWithIconProps extends BadgeProps {
  icon?: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
}

Badge.WithIcon = function BadgeWithIcon({
  icon: Icon,
  className,
  children,
  ...rest
}: BadgeWithIconProps): JSX.Element {
  return (
    <Badge className={cn('flex items-center space-x-2', className)} {...rest}>
      {Icon && <Icon className="size-4 shrink-0" />}
      {children && (
        <div className="flex-1 overflow-hidden text-ellipsis">{children}</div>
      )}
    </Badge>
  );
};

export { Badge, badgeVariants };
