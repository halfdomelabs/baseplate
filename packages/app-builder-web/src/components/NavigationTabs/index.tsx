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
        'text-sm font-semibold text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700',
        className
      )}
    >
      <ul className="flex flex-wrap -mb-px">{children}</ul>
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
          'inline-block p-4 rounded-t-lg border-b-2 border-transparent',
          {
            'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500':
              selected,
            'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300':
              !selected,
          }
        )}
      >
        {children}
      </Link>
    </li>
  );
};

export default NavigationTabs;
