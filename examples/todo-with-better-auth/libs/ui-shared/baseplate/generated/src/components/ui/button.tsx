import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { Button as ButtonPrimitive } from '@base-ui/react/button';

import { buttonVariants } from '../../styles/button.js';
import { cn } from '../../utils/cn.js';

export interface ButtonProps
  extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {}

/**
 * Displays a button or a component that looks like a button.
 *
 * ShadCN changes:
 * - Added ghostDestructive variant
 * - Updated link variant to use primary color
 * - Added linkDestructive variant
 * - Added ability to set no size to the button
 * - Added ability to set justify to the button
 * - Variants live in `#src/styles/button.js` so NumberField and Calendar can
 *   render a button without importing the component
 * - The destructive variant stays a solid fill; ghostDestructive and
 *   linkDestructive cover the tinted cases upstream folded into it
 *
 * https://ui.shadcn.com/docs/components/button
 */
function Button({
  className,
  variant,
  size,
  justify,
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, justify, className }))}
      {...props}
    />
  );
}

export { Button };
