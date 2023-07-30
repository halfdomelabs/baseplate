import { clsx } from 'clsx';
import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';
import { IconElement } from '@src/types/react.js';

/**
 * Variant styles for the Button component
 */
type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

/**
 * Sizes for the Button component
 */
type ButtonSize = 'icon' | 'sm' | 'md' | 'lg';

export interface ButtonProps {
  asChild?: boolean;
  /**
   * Optional class name to be applied to the button
   */
  className?: string;
  /**
   * Content of the button
   */
  children?: React.ReactNode;
  /**
   * Event handler for button click
   */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * Indicates if the button is disabled
   */
  disabled?: boolean;
  /**
   * Variant style of the button
   */
  variant?: ButtonVariant;
  /**
   * Size of the button
   */
  size?: ButtonSize;
  /**
   * Type attribute of the button
   */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Icon to be rendered before the button content
   */
  iconBefore?: IconElement;
  /**
   * Icon to be rendered after the button content
   */
  iconAfter?: IconElement;
  /**
   * Title attribute of the button
   */
  title?: string;
  /**
   * Indicates if the button should not add a border/rounded edges (useful for button gorups)
   */
  noBorder?: boolean;
  formId?: string;
}

export function getButtonVariantClass(
  color: ButtonVariant,
  isDisabled?: boolean,
  noBorder?: boolean
): string {
  if (isDisabled) {
    return clsx(
      color !== 'tertiary' && !noBorder && 'shadow',
      color === 'primary' &&
        'border-transparent bg-primary-500 text-foreground-50 dark:bg-primary-800 dark:text-foreground-400',
      color === 'secondary' &&
        'border-secondary-300 bg-secondary-50 text-foreground-500 dark:border-secondary-700 dark:bg-foreground-900 dark:text-foreground-400',
      color === 'tertiary' &&
        'border-transparent bg-transparent text-foreground-500 dark:border-transparent dark:text-foreground-400'
    );
  }
  return clsx(
    color !== 'tertiary' && !noBorder && 'shadow',
    color === 'primary' &&
      'border-transparent bg-primary-700 text-white hover:bg-primary-800 active:text-foreground-200',
    color === 'secondary' &&
      'border-secondary-300 bg-black bg-opacity-0 text-foreground-700 hover:bg-opacity-5 active:text-foreground-900',
    color === 'secondary' &&
      'dark:border-secondary-700 dark:bg-white dark:bg-opacity-0 dark:text-foreground-200 dark:hover:bg-opacity-10 dark:active:text-foreground-400',
    color === 'tertiary' &&
      'border-transparent bg-black bg-opacity-0 text-foreground-700 hover:bg-opacity-5 active:text-black',
    color === 'tertiary' &&
      'dark:border-transparent dark:bg-white dark:bg-opacity-0 dark:text-foreground-200 dark:hover:bg-opacity-10 dark:active:text-white'
  );
}

export function getButtonSizeClass(
  size: ButtonSize,
  noBorder?: boolean
): string {
  return clsx(
    size === 'icon' && !noBorder && 'rounded-lg',
    size === 'icon' && 'p-1 text-lg',
    size === 'sm' && !noBorder && 'rounded',
    size === 'sm' && 'px-2.5 py-1.5 text-xs',
    size === 'md' && !noBorder && 'rounded-md',
    size === 'md' && 'px-4 py-2 text-sm',
    size === 'lg' && !noBorder && 'rounded-lg',
    size === 'lg' && 'px-6 py-3 text-base'
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild,
      className,
      children,
      disabled,
      size = 'md',
      variant = 'primary',
      type = 'button',
      onClick,
      iconBefore: IconBefore,
      iconAfter: IconAfter,
      title,
      noBorder,
      formId,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        {...props}
        className={clsx(
          noBorder ? '' : 'border',
          'text-center font-medium  transition-colors focus:outline-1 focus:outline-offset-4 focus:outline-primary-700 dark:focus:outline-transparent',
          getButtonVariantClass(variant, disabled, noBorder),
          getButtonSizeClass(size, noBorder),
          className
        )}
        disabled={disabled}
        onClick={onClick}
        // a type is being provided but eslint doesn't know
        // eslint-disable-next-line react/button-has-type
        type={type}
        ref={ref}
        title={title}
        form={formId}
      >
        {IconBefore || IconAfter ? (
          <div className="flex items-center justify-center space-x-2">
            {IconBefore && <IconBefore />}
            {children && <div>{children}</div>}
            {IconAfter && <IconAfter />}
          </div>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
