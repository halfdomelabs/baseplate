// @ts-nocheck

import type { VariantProps } from 'class-variance-authority';
import type React from 'react';

import { cn } from '$cn';
import { cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
/**
 * Displays a badge or a component that looks like a badge.
 *
 * -- Added BadgeWithIcon variation
 *
 * https://ui.shadcn.com/docs/components/badge
 */
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }): React.ReactElement {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export interface BadgeWithIconProps extends React.ComponentProps<typeof Badge> {
  icon?: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
}

function BadgeWithIcon({
  icon: Icon,
  className,
  children,
  ...rest
}: BadgeWithIconProps): React.JSX.Element {
  return (
    <Badge className={cn('flex items-center space-x-2', className)} {...rest}>
      {Icon && <Icon className="size-4 shrink-0" />}
      {children && (
        <div className="flex-1 overflow-hidden text-ellipsis">{children}</div>
      )}
    </Badge>
  );
}

export { Badge, badgeVariants, BadgeWithIcon };
