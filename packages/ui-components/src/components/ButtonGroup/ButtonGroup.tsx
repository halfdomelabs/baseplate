import React from 'react';

import { cn } from '@src/utils/cn.js';

import type { ButtonProps } from '../Button/Button.js';

import { Button } from '../Button/Button.js';

/**
 * Displays a list of buttons aligned next to one another.
 */

const ButtonGroupBase = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn('inline-flex rounded-md shadow', className)}
    {...props}
    ref={ref}
  />
));

ButtonGroupBase.displayName = 'ButtonGroup';

const ButtonGroupButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button
      className={cn(
        '[&:not(:first-child)]:rounded-l-none [&:not(:last-child)]:rounded-r-none [&:not(:last-child)]:border-r-0',
        // allow ring to show above neighbors
        'focus-visible:z-10',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

ButtonGroupButton.displayName = 'ButtonGroupButton';

export const ButtonGroup = Object.assign(ButtonGroupBase, {
  Button: ButtonGroupButton,
});
