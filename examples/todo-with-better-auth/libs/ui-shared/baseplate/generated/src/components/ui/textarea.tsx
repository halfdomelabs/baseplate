import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { textareaVariants } from '../../styles/input.js';
import { cn } from '../../utils/cn.js';

export interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

/**
 * A textarea component.
 *
 * ShadCN changes:
 * - Exports `TextareaProps` for consumers that wrap it
 * - Classes live in the shared `textareaVariants` and are exposed as a `size`
 *   prop, which adds an `xl` tier sized for touch
 * - Fills with `bg-control-background` so the control contrasts with the
 *   surface it sits on rather than always matching the page.
 *
 * https://ui.shadcn.com/docs/components/textarea
 */
function Textarea({
  className,
  size,
  ...props
}: TextareaProps): React.ReactElement {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  );
}

export { Textarea };
