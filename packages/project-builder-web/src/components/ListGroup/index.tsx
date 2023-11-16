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
        'rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
        className,
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
        'w-full border-b border-gray-200 px-4 py-2 last:border-none dark:border-gray-600',
        className,
      )}
    >
      {children}
    </li>
  );
};

export default ListGroup;
