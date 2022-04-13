import { Disclosure } from '@headlessui/react';
import classNames from 'classnames';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { Link, useMatch, useResolvedPath } from 'react-router-dom';

interface Props {
  className?: string;
  children: React.ReactNode;
}

// https://flowbite.com/docs/components/sidebar/

function Sidebar({ className, children }: Props): JSX.Element {
  return (
    <aside
      className={classNames('w-64 bg-gray-50', className)}
      aria-label="Sidebar"
    >
      <div className="h-full overflow-y-auto py-4 px-3 dark:bg-gray-800">
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

interface SidebarItemProps {
  className?: string;
  children: React.ReactNode;
}

Sidebar.Item = function SidebarItem({
  className,
  children,
}: SidebarItemProps): JSX.Element {
  return <li className={className}>{children}</li>;
};

Sidebar.ButtonItem = function SidebarButton({
  className,
  Icon,
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

Sidebar.LinkItem = function SidebarLink({
  className,
  Icon,
  to,
  children,
}: SidebarLinkProps): JSX.Element {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: `${resolved.pathname}/*` });

  return (
    <li className={className}>
      <Link
        to={to}
        className={classNames(
          ' flex items-center p-2 text-base text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 no-underline',
          match ? 'font-semibold' : 'font-normal'
        )}
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

interface SidebarDropdownProps {
  className?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}

Sidebar.Dropdown = function SidebarDropdown({
  className,
  Icon,
  label,
  children,
}: SidebarDropdownProps): JSX.Element {
  return (
    <Disclosure as="li" className={className}>
      <Disclosure.Button className="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
        {Icon ? (
          <>
            <Icon className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
            <span className="flex-1 ml-3 text-left whitespace-nowrap">
              {label}
            </span>
          </>
        ) : (
          <span>{label}</span>
        )}
        <MdKeyboardArrowDown className="w-6 h-6" />
      </Disclosure.Button>
      <Disclosure.Panel as="ul" className="py-2 space-y-2">
        {children}
      </Disclosure.Panel>
    </Disclosure>
  );
};

interface SidebarDropdownLinkItemProps {
  className?: string;
  to: string;
  children: React.ReactNode;
  withParentIcon?: boolean;
}

Sidebar.DropdownLinkItem = function SidebarDropdownLinkItem({
  className,
  to,
  children,
  withParentIcon,
}: SidebarDropdownLinkItemProps): JSX.Element {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname });

  return (
    <li className={className}>
      <Link
        to={to}
        className={classNames(
          'flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700',
          withParentIcon ? 'pl-11' : 'pl-5',
          match ? 'font-semibold' : 'font-normal'
        )}
      >
        <span>{children}</span>
      </Link>
    </li>
  );
};

export default Sidebar;
