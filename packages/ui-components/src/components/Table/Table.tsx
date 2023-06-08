import { clsx } from 'clsx';

// Adapted from https://flowbite.com/docs/components/tables

interface TableProps {
  className?: string;
  children: React.ReactNode;
}

export function Table({ className, children }: TableProps): JSX.Element {
  return (
    <div
      className={clsx(
        'relative overflow-x-auto sm:-mx-2 sm:rounded-lg lg:-mx-4',
        className
      )}
    >
      <div className="inline-block min-w-full py-2 sm:px-2 lg:px-4">
        <div className="overflow-hidden shadow-md sm:rounded-lg">
          <table className="min-w-full text-left">{children}</table>
        </div>
      </div>
    </div>
  );
}

interface TableHeadProps {
  className?: string;
  children: React.ReactNode;
}

Table.Head = function TableHead({
  className,
  children,
}: TableHeadProps): JSX.Element {
  return (
    <thead
      className={clsx('bg-background-100 dark:bg-background-700', className)}
    >
      {children}
    </thead>
  );
};

interface TableHeadRowProps {
  className?: string;
  children: React.ReactNode;
}

Table.HeadRow = function TableHeadRow({
  className,
  children,
}: TableHeadRowProps): JSX.Element {
  return <tr className={className}>{children}</tr>;
};

interface TableHeadCellProps {
  className?: string;
  children?: React.ReactNode;
}

Table.HeadCell = function TableHeadCell({
  className,
  children,
}: TableHeadCellProps): JSX.Element {
  return (
    <th
      scope="col"
      className={clsx(
        'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground-800 dark:text-foreground-400',
        className
      )}
    >
      {children}
    </th>
  );
};

interface TableBodyProps {
  className?: string;
  children: React.ReactNode;
}

Table.Body = function TableBody({
  className,
  children,
}: TableBodyProps): JSX.Element {
  return <tbody className={clsx('', className)}>{children}</tbody>;
};

interface TableRowProps {
  className?: string;
  children: React.ReactNode;
}

Table.Row = function TableRow({
  className,
  children,
}: TableRowProps): JSX.Element {
  return (
    <tr
      className={clsx(
        'border-b border-background-200 bg-white dark:border-background-700 dark:bg-background-800',
        className
      )}
    >
      {children}
    </tr>
  );
};

interface TableCellProps {
  className?: string;
  children: React.ReactNode;
}

Table.Cell = function TableCell({
  className,
  children,
}: TableCellProps): JSX.Element {
  return (
    <td
      className={clsx(
        'whitespace-nowrap px-6 py-4 text-sm text-foreground-500 dark:text-foreground-400',
        className
      )}
    >
      {children}
    </td>
  );
};
