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
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  /**
   * Optional class name to be applied to the button
   */
  className?: string;
  /**
   * Content of the button
   */
  children: React.ReactNode;
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
      color === 'primary' &&
        'border-transparent bg-primary-400 text-white dark:bg-primary-950',
      color === 'secondary' &&
        'border-secondary-300 bg-transparent text-secondary-500 dark:border-secondary-700 dark:text-secondary-400',
      color === 'tertiary' &&
        'border-transparent bg-transparent text-secondary-500 dark:border-transparent dark:text-secondary-400'
    );
  }
  return clsx(
    color === 'primary' &&
      'border-transparent bg-primary-700 text-white hover:bg-primary-800 focus:ring-primary-200 active:bg-primary-900',
    color === 'secondary' &&
      'border-secondary-300 bg-transparent text-secondary-900 hover:bg-secondary-100 focus:ring-secondary-200 active:bg-secondary-200',
    color === 'secondary' &&
      'dark:border-secondary-700 dark:bg-transparent dark:text-white dark:hover:bg-secondary-900 dark:focus:ring-secondary-800 dark:focus:active:bg-secondary-800',
    color === 'tertiary' &&
      'border-transparent bg-transparent text-secondary-900 hover:border-secondary-300 focus:ring-secondary-200 active:bg-secondary-200',
    color === 'tertiary' &&
      'dark:border-transparent dark:bg-transparent dark:text-white dark:hover:border-secondary-900 dark:focus:ring-secondary-800 dark:active:bg-secondary-800'
  );
}

function getButtonSizeClass(size: ButtonSize): string {
  return clsx(
    size === 'small' && 'px-2 py-1 text-xs',
    size === 'medium' && 'px-4 py-2 text-sm',
    size === 'large' && 'px-6 py-3 text-base'
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
    size = 'medium',
    variant = 'primary',
    type = 'button',
    onClick,
    iconBefore: IconBefore,
    iconAfter: IconAfter,
  } = props;
  return (
    <button
      className={clsx(
        'rounded-lg border-2 text-center font-medium transition-colors focus:outline-2 focus:outline-offset-4 focus:outline-transparent focus:ring-4 focus:ring-opacity-80 disabled:cursor-not-allowed dark:focus:outline-transparent',
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
          <div>{children}</div>
          {IconAfter && <IconAfter />}
        </div>
      ) : (
        children
      )}
    </button>
  );
}

export const Button = forwardRef(ButtonFn);
