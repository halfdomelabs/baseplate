// @ts-nocheck
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
        'max-w-sm rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800',
        { 'sm:p-6 lg:p-8': padding },
        className
      )}
    >
      {children}
    </div>
  );
}

export default Card;
