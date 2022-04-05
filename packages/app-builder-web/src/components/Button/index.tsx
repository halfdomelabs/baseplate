import classNames from 'classnames';

interface Props {
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  secondary?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

function getButtonColorClass(props: Props): string {
  if (props.secondary) {
    return 'text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700';
  }
  if (!props.disabled) {
    return 'text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800';
  }
  return 'text-white bg-blue-400 dark:bg-blue-500 cursor-not-allowed';
}

function Button(props: Props): JSX.Element {
  const { className, children, disabled, type = 'button', onClick } = props;
  return (
    <button
      className={classNames(
        ' font-medium rounded-lg text-sm px-5 py-2.5 text-center',
        getButtonColorClass(props),
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
