// @ts-nocheck

import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '$cn';
import { buttonVariants } from '$stylesButton';
import { Slot } from 'radix-ui';

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
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
  type = 'button',
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }): React.ReactElement {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, justify, className }))}
      type={type}
      {...props}
    />
  );
}

export { Button };
