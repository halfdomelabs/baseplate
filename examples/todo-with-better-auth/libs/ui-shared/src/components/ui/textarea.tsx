import type * as React from 'react';

import { cn } from '../../utils/cn.js';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'sm' | 'default' | 'xl';
}

/**
 * A textarea component.
 *
 * ShadCN changes:
 * - Exports `TextareaProps` for consumers that wrap it
 * - Added a `size` scale, including an `xl` tier sized for touch
 * - Fills with `bg-control-background` so the control contrasts with the
 *   surface it sits on rather than always matching the page.
 *
 * https://ui.shadcn.com/docs/components/textarea
 */
function Textarea({
  className,
  size = 'default',
  ...props
}: TextareaProps): React.ReactElement {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(
        // `md:text-sm` is dropped at `xl`, which stays at 16px on every screen.
        'flex field-sizing-content w-full rounded-lg border border-input bg-control-background text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:min-h-16 data-[size=default]:px-2.5 data-[size=default]:py-2 data-[size=sm]:min-h-14 data-[size=sm]:px-2 data-[size=sm]:py-1.5 data-[size=xl]:min-h-20 data-[size=xl]:px-4 data-[size=xl]:py-2.5 data-[size=default]:md:text-sm data-[size=sm]:md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
