import classNames from 'classnames';

interface Props {
  className?: string;
  children: React.ReactNode;
}

// https://flowbite.com/docs/components/tables/

function Table({ className, children }: Props): JSX.Element {
  return (
    <div className={classNames('flex flex-col', className)}>
      <div className="overflow-x-auto sm:-mx-2 lg:-mx-4">
        <div className="inline-block min-w-full py-2 sm:px-2 lg:px-4">
          <div className="overflow-hidden shadow-md sm:rounded-lg">
            <table className="min-w-full">{children}</table>
          </div>
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
    <thead className={classNames('bg-gray-50 dark:bg-gray-700', className)}>
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
      className={classNames(
        'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-400',
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
  return <tbody className={classNames('', className)}>{children}</tbody>;
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
      className={classNames(
        'border-b bg-white dark:border-gray-700 dark:bg-gray-800',
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
      className={classNames(
        'whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400',
        className
      )}
    >
      {children}
    </td>
  );
};

export default Table;
