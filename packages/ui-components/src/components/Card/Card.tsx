import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps): JSX.Element {
  return (
    <div
      className={clsx(
        'rounded-lg border border-background-200 bg-white shadow dark:border-background-700 dark:bg-background-900',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

Card.Body = function CardBody({
  className,
  children,
}: CardBodyProps): JSX.Element {
  return <div className={clsx('p-4', className)}>{children}</div>;
};
