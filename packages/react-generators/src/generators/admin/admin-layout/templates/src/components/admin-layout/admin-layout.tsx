// @ts-nocheck

import type { ReactElement } from 'react';

import { useLogOut } from '%authHooksImports';
import {
  NavigationMenu,
  NavigationMenuItemWithLink,
  NavigationMenuList,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '%reactComponentsImports';
import { Outlet } from 'react-router-dom';

interface Props {
  className?: string;
}

export function AdminLayout({ className }: Props): ReactElement {
  const logOut = useLogOut();

  return (
    <SidebarLayout className={className}>
      <SidebarLayoutSidebar>
        <div className="mb-4">
          <h1>Admin Dashboard</h1>
        </div>
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            <TPL_SIDEBAR_LINKS />
            <NavigationMenuItemWithLink asChild>
              <button
                className="cursor-pointer text-left"
                onClick={() => {
                  logOut();
                }}
              >
                Log Out
              </button>
            </NavigationMenuItemWithLink>
          </NavigationMenuList>
        </NavigationMenu>
      </SidebarLayoutSidebar>
      <SidebarLayoutContent>
        <Outlet />
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}
