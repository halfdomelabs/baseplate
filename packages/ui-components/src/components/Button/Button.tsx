import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@src/utils';

/**
 * Button component
 *
 * https://ui.shadcn.com/docs/components/button
 */

export const buttonVariants = cva(
  'inline-flex gap-2  active:brightness-95 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary border border-input-border text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input-border bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary border border-input-border text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonBase.displayName = 'Button';

export interface ButtonIconProps extends React.SVGAttributes<SVGElement> {
  icon: (props: React.SVGAttributes<SVGElement>) => JSX.Element;
}

const ButtonIcon = ({
  className,
  icon: Icon,
  ...props
}: ButtonIconProps): JSX.Element => (
  <Icon className={cn('h-4 w-4', className)} {...props} />
);

export const Button = Object.assign(ButtonBase, { Icon: ButtonIcon });
