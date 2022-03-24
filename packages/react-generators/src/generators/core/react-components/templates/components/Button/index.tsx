// @ts-nocheck
import classNames from 'classnames';

interface Props {
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

function Button({
  className,
  children,
  disabled,
  type = 'button',
  onClick,
}: Props): JSX.Element {
  return (
    <button
      className={classNames(
        'text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center',
        {
          'bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800':
            !disabled,
          'bg-blue-400 dark:bg-blue-500 cursor-not-allowed': disabled,
        },
        className
      )}
      disabled={disabled}
      onClick={onClick}
      // a type is being provided but eslint doesn't know
      // eslint-disable-next-line react/button-has-type
      type={type}
    >
      {children}
    </button>
  );
}

export default Button;
