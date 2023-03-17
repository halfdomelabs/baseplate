// @ts-nocheck

import classNames from 'classnames';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '%react-components';
import { useLogOut } from '%auth-hooks/useLogOut';
import { MdLogout } from 'react-icons/md';

interface Props {
  className?: string;
}

function AdminLayout({ className }: Props): JSX.Element {
  const logOut = useLogOut();

  return (
    <div className={classNames('flex h-full items-stretch', className)}>
      <Sidebar className="flex-none">
        <Sidebar.Header className="mb-4 space-y-2">
          <h1>Admin Dashboard</h1>
        </Sidebar.Header>
        <Sidebar.LinkGroup>
          <SIDEBAR_NAV />
          <Sidebar.ButtonItem Icon={MdLogout} onClick={() => logOut()}>
            Log Out
          </Sidebar.ButtonItem>
        </Sidebar.LinkGroup>
      </Sidebar>
      <div className="flex flex-auto flex-col overflow-auto p-4">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
