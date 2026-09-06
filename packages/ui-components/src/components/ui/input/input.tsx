import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { inputVariants } from '#src/styles/index.js';
import { cn } from '#src/utils/index.js';

export interface InputProps
  // `size` and `height` shadow DOM attributes of the same name on <input />.
  extends
    Omit<React.ComponentPropsWithRef<'input'>, 'height' | 'size'>,
    VariantProps<typeof inputVariants> {}

/**
 * Input component for a styled <input /> element.
 *
 * ShadCN changes:
 * - Classes live in the shared `inputVariants`, which NumberField and
 *   ColorPickerField also render, and are exposed as `size`/`height`/`background`
 *   props
 * - `size` adds an `xl` tier sized for touch; the DOM `size` attribute is
 *   omitted in its favour
 * - Renders a plain <input /> rather than Base UI's Input primitive
 * - Fills with `bg-control-background` so the control contrasts with the
 *   surface it sits on rather than always matching the page.
 *
 * https://ui.shadcn.com/docs/components/input
 */
function Input({
  className,
  type,
  size,
  height,
  background,
  ...props
}: InputProps): React.ReactElement {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size, height, background }), className)}
      {...props}
    />
  );
}

export { Input };
