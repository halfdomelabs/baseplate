import classNames from 'classnames';

interface Props {
  className?: string;
  children: React.ReactNode;
  padding?: boolean;
}

function Card({ className, padding, children }: Props): JSX.Element {
  return (
    <div
      className={classNames(
        'max-w-sm bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700',
        { 'sm:p-6 lg:p-8': padding },
        className
      )}
    >
      {children}
    </div>
  );
}

export default Card;
