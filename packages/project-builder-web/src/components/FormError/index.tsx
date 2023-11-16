import classNames from 'classnames';

interface Props {
  className?: string;
  children: React.ReactNode;
}

function FormError({ className, children }: Props): JSX.Element {
  return (
    <div
      className={classNames(
        'mt-2 text-sm text-red-600 dark:text-red-500',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default FormError;
