import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: boolean;
}

export function Card({ className, padding, children }: CardProps): JSX.Element {
  return (
    <div
      className={clsx(
        'max-w-sm rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800',
        { 'sm:p-6 lg:p-8': padding },
        className
      )}
    >
      {children}
    </div>
  );
}
