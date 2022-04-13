import classNames from 'classnames';

interface Props {
  className?: string;
  children: React.ReactNode;
}

function FormLabel({ className, children }: Props): JSX.Element {
  return (
    <div
      className={classNames(
        'text-sm mb-2 font-semibold text-gray-900 dark:text-gray-300',
        className
      )}
    >
      {children}
    </div>
  );
}

export default FormLabel;
