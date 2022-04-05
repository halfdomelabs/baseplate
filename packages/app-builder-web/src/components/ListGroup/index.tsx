import classNames from 'classnames';

interface Props {
  className?: string;
  children: React.ReactNode;
}

// based off https://flowbite.com/docs/components/list-group/

function ListGroup({ className, children }: Props): JSX.Element {
  return (
    <ul
      className={classNames(
        'text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white',
        className
      )}
    >
      {children}
    </ul>
  );
}

interface ListGroupItemProps {
  className?: string;
  children: React.ReactNode;
}

ListGroup.Item = function ListGroupItem({
  className,
  children,
}: ListGroupItemProps): JSX.Element {
  return (
    <li
      className={classNames(
        'w-full px-4 py-2 border-b border-gray-200 dark:border-gray-600 last:border-none',
        className
      )}
    >
      {children}
    </li>
  );
};

export default ListGroup;
