// @ts-nocheck
import classNames from 'classnames';
import { MdList } from 'react-icons/md';
import { Link } from 'react-router-dom';

interface Props {
  className?: string;
  children: React.ReactNode;
}

// https://flowbite.com/docs/components/sidebar/

function Sidebar({ className, children }: Props): JSX.Element {
  return (
    <aside className={classNames('w-64', className)} aria-label="Sidebar">
      <div className="h-full overflow-y-auto py-4 px-3 bg-gray-50 dark:bg-gray-800">
        {children}
      </div>
    </aside>
  );
}

interface SidebarHeaderProps {
  className?: string;
  children: React.ReactNode;
}

Sidebar.Header = function SidebarHeader({
  className,
  children,
}: SidebarHeaderProps): JSX.Element {
  return <div className={classNames('pl-2', className)}>{children}</div>;
};

interface SidebarLinkGroupProps {
  className?: string;
  children: React.ReactNode;
}

Sidebar.LinkGroup = function SidebarLinkGroup({
  className,
  children,
}: SidebarLinkGroupProps): JSX.Element {
  return <ul className={classNames('space-y-2', className)}>{children}</ul>;
};

interface SidebarButtonProps {
  className?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  onClick?: React.MouseEventHandler;
  children: React.ReactNode;
}

Sidebar.Button = function SidebarButton({
  className,
  Icon = MdList,
  onClick,
  children,
}: SidebarButtonProps): JSX.Element {
  return (
    <li className={className}>
      <button
        onClick={onClick}
        className="flex w-full items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        type="button"
      >
        {Icon ? (
          <>
            <Icon className="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
            <span className="ml-3">{children}</span>
          </>
        ) : (
          <span>{children}</span>
        )}
      </button>
    </li>
  );
};

interface SidebarLinkProps {
  className?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  to: string;
  children: React.ReactNode;
}

Sidebar.Link = function SidebarLink({
  className,
  Icon,
  to,
  children,
}: SidebarLinkProps): JSX.Element {
  return (
    <li className={className}>
      <Link
        to={to}
        className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 no-underline"
      >
        {Icon ? (
          <>
            <Icon className="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
            <span className="ml-3">{children}</span>
          </>
        ) : (
          <span>{children}</span>
        )}
      </Link>
    </li>
  );
};

export default Sidebar;
