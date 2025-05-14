import type React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';

import { buttonVariants } from '@src/styles';
import { cn } from '@src/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Displays a button or a component that looks like a button.
 *
 * https://ui.shadcn.com/docs/components/button
 */
function Button({
  className,
  variant,
  size,
  justify,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }): React.ReactElement {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, justify, className }))}
      {...props}
    />
  );
}

export { Button };
