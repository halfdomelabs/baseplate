import React from 'react';
import { cn } from '@src/utils/cn.js';
import { Button, ButtonProps } from '../Button/Button.js';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const ButtonGroupBase = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn('inline-flex rounded-md shadow', className)}
        {...props}
        ref={ref}
      />
    );
  }
);

ButtonGroupBase.displayName = 'ButtonGroup';

const ButtonGroupButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        className={cn(
          '[&:not(:last-child)]:border-r-none [&:not(:first-child)]:border-l-none [&:not(:first-child)]:rounded-l-none [&:not(:last-child)]:rounded-r-none',
          // allow ring to show above neighbors
          'focus-visible:z-10',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

ButtonGroupButton.displayName = 'ButtonGroupButton';

export const ButtonGroup = Object.assign(ButtonGroupBase, {
  Button: ButtonGroupButton,
});
