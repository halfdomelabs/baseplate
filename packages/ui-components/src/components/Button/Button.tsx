import { clsx } from 'clsx';
import { ForwardedRef, forwardRef } from 'react';
import { IconType } from 'react-icons';

/**
 * Variant styles for the Button component
 */
type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

/**
 * Sizes for the Button component
 */
type ButtonSize = 'icon' | 'sm' | 'md' | 'lg';

export interface ButtonProps {
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
  iconBefore?: IconType;
  /**
   * Icon to be rendered after the button content
   */
  iconAfter?: IconType;
}

function getButtonVariantClass(
  color: ButtonVariant,
  isDisabled?: boolean
): string {
  if (isDisabled) {
    return clsx(
      color !== 'tertiary' && 'shadow',
      color === 'primary' &&
        'border-transparent bg-primary-400 text-secondary-50 dark:bg-primary-800 dark:text-secondary-400',
      color === 'secondary' &&
        'border-secondary-300 bg-secondary-50 text-secondary-500 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-400',
      color === 'tertiary' &&
        'border-transparent bg-transparent text-secondary-500 dark:border-transparent dark:text-secondary-400'
    );
  }
  return clsx(
    color !== 'tertiary' && 'shadow',
    color === 'primary' &&
      'border-transparent bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
    color === 'secondary' &&
      'border-secondary-300 bg-black bg-opacity-0 text-secondary-900 hover:bg-opacity-5 active:bg-opacity-10',
    color === 'secondary' &&
      'dark:border-secondary-700 dark:bg-white dark:bg-opacity-0 dark:text-white dark:hover:bg-opacity-10 dark:active:bg-opacity-[0.15]',
    color === 'tertiary' &&
      'border-transparent bg-black bg-opacity-0 text-secondary-900 hover:bg-opacity-5 active:bg-opacity-10',
    color === 'tertiary' &&
      'dark:border-transparent dark:bg-white dark:bg-opacity-0 dark:text-white dark:hover:bg-opacity-10 dark:active:bg-opacity-[0.15]'
  );
}

function getButtonSizeClass(size: ButtonSize): string {
  return clsx(
    size === 'icon' && 'rounded-full p-2.5 text-lg',
    size === 'sm' && 'rounded px-2.5 py-1.5 text-xs',
    size === 'md' && 'rounded-md px-4 py-2 text-sm',
    size === 'lg' && 'rounded-lg px-6 py-3 text-base'
  );
}

/**
 * Primary UI component for user interaction
 */
function ButtonFn(
  props: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
): JSX.Element {
  const {
    className,
    children,
    disabled,
    size = 'md',
    variant = 'primary',
    type = 'button',
    onClick,
    iconBefore: IconBefore,
    iconAfter: IconAfter,
  } = props;
  return (
    <button
      className={clsx(
        'border text-center font-medium  transition-colors focus:outline-1 focus:outline-offset-4 focus:outline-primary-700 disabled:cursor-not-allowed dark:focus:outline-transparent',
        getButtonVariantClass(variant, disabled),
        getButtonSizeClass(size),
        className
      )}
      disabled={disabled}
      onClick={onClick}
      // a type is being provided but eslint doesn't know
      // eslint-disable-next-line react/button-has-type
      type={type}
      ref={ref}
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
    </button>
  );
}

export const Button = forwardRef(ButtonFn);
