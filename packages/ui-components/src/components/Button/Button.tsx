import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

type ButtonSize = 'small' | 'base' | 'large';

interface ButtonProps {
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}

function getButtonVariantClass(color: ButtonVariant): string {
  return clsx(
    color === 'primary' &&
      'bg-primary-700 text-white hover:bg-primary-800 focus:ring-primary-300',
    color === 'secondary' &&
      'bg-white text-white hover:bg-green-800 focus:ring-green-300',
    color === 'tertiary' &&
      'bg-red-700 text-white hover:bg-red-800 focus:ring-red-300'
  );
}

function getButtonSizeClass(size: ButtonSize): string {
  return clsx(
    size === 'small' && 'px-3 py-2 text-sm',
    size === 'base' && 'px-5 py-2.5 text-sm',
    size === 'large' && 'px-5 py-3 text-base'
  );
}

export function Button(props: ButtonProps): JSX.Element {
  const {
    className,
    children,
    disabled,
    size = 'base',
    variant = 'primary',
    type = 'button',
    onClick,
    icon,
  } = props;
  return (
    <button
      className={clsx(
        'rounded-lg text-center font-medium focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-opacity-50',
        getButtonVariantClass(variant),
        getButtonSizeClass(size),
        className
      )}
      disabled={disabled}
      onClick={onClick}
      // a type is being provided but eslint doesn't know
      // eslint-disable-next-line react/button-has-type
      type={type}
    >
      {icon ? (
        <div className="flex flex-row items-center space-x-2">
          {icon}
          <div>{children}</div>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
