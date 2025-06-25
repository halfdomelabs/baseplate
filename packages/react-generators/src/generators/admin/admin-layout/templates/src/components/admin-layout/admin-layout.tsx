// @ts-nocheck

import type { ReactElement } from 'react';

import { useLogOut } from '%authHooksImports';
import { Sidebar } from '%reactComponentsImports';
import clsx from 'clsx';
import { MdLogout } from 'react-icons/md';
import { Outlet } from 'react-router-dom';

interface Props {
  className?: string;
}

export function AdminLayout({ className }: Props): ReactElement {
  const logOut = useLogOut();

  return (
    <div className={clsx('flex h-full items-stretch', className)}>
      <Sidebar className="flex-none">
        <Sidebar.Header className="mb-4 space-y-2">
          <h1>Admin Dashboard</h1>
        </Sidebar.Header>
        <Sidebar.LinkGroup>
          <TPL_SIDEBAR_LINKS />
          <Sidebar.ButtonItem
            Icon={MdLogout}
            onClick={() => {
              logOut();
            }}
          >
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
