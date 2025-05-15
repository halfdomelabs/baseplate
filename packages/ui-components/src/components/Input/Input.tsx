import type * as React from 'react';

import { inputVariants } from '@src/styles';
import { cn } from '@src/utils';

/**
 * Input component for a styled <input /> element.
 *
 * -- Added more variants for height and right padding
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
