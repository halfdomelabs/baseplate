import classNames from 'classnames';
import { Link, useMatch, useResolvedPath } from 'react-router-dom';

interface Props {
  className?: string;
  children: React.ReactNode;
}

function NavigationTabs({ className, children }: Props): JSX.Element {
  return (
    <div
      className={classNames(
        'border-b border-gray-200 text-center text-sm font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400',
        className,
      )}
    >
      <ul className="-mb-px flex flex-wrap">{children}</ul>
    </div>
  );
}

interface TabsTabProps {
  className?: string;
  children: React.ReactNode;
  to: string;
}

NavigationTabs.Tab = function TabsTab({
  className,
  children,
  to,
}: TabsTabProps): JSX.Element {
  const resolvedPath = useResolvedPath(to);
  const selected = useMatch({ path: resolvedPath.pathname, end: true });
  return (
    <li className={classNames('mr-2 cursor-pointer', className)}>
      <Link
        to={to}
        className={classNames(
          'inline-block rounded-t-lg border-b-2 border-transparent p-4',
          {
            'active border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500':
              selected,
            'hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300':
              !selected,
          },
        )}
      >
        {children}
      </Link>
    </li>
  );
};

export default NavigationTabs;
