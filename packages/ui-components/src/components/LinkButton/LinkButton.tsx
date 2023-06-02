import { clsx } from 'clsx';
import React from 'react';

interface LinkButtonProps {
  /**
   * The class name(s) to apply to the button
   */
  className?: string;
  /**
   * The content of the button
   */
  children: React.ReactNode;
  /**
   * The click handler
   */
  onClick?: React.MouseEventHandler;
  /**
   * The type of button
   */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

/**
 * A button that looks like a link
 */
export function LinkButton({
  className,
  children,
  onClick,
  type = 'button',
  disabled,
}: LinkButtonProps): JSX.Element {
  return (
    <button
      className={clsx(
        'font-semibold',
        disabled && 'text-primary-500 dark:text-primary-600',
        !disabled && 'link',
        className
      )}
      // a type is being provided but eslint doesn't know
      // eslint-disable-next-line react/button-has-type
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
