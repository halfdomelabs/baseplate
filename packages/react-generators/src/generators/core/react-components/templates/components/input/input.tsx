// @ts-nocheck

import type * as React from 'react';

import { cn } from '$cn';
import { inputVariants } from '$stylesInput';

/**
 * Input component for a styled <input /> element.
 *
 * https://ui.shadcn.com/docs/components/input
 */
function Input({
  className,
  type,
  ...props
}: React.ComponentPropsWithRef<'input'>): React.ReactElement {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants(), className)}
      {...props}
    />
  );
}

export { Input };
