import * as React from 'react';

import { inputVariants } from '@src/styles';
import { cn } from '@src/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  // eslint-disable-next-line react/prop-types
  ({ className, type, ...props }, ref) => (
      <input
        type={type}
        className={cn(inputVariants(), className)}
        ref={ref}
        {...props}
      />
    ),
);
Input.displayName = 'Input';
