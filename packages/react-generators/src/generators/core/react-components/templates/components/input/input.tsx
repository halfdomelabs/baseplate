// @ts-nocheck

import type * as React from 'react';

import { inputVariants } from '../../styles/input.js';
import { cn } from '../../utils/cn.js';

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
