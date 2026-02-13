import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { Slot } from 'radix-ui';

import { buttonVariants } from '#src/styles/index.js';
import { cn } from '#src/utils/index.js';

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Displays a button or a component that looks like a button.
 *
 * - Added ghostDestructive variant
 * - Updated link variant to use primary color
 * - Added linkDestructive variant
 * - Added ability to set no size to the button
 * - Added ability to set justify to the button
 * - Default to type="button" if not provided
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
