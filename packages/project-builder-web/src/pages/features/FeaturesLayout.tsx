import type React from 'react';

import {
  NavigationMenu,
  NavigationMenuItemWithLink,
  NavigationMenuList,
  SidebarLayout,
} from '@halfdomelabs/ui-components';
import { MdPeople } from 'react-icons/md';
import { Link, NavLink, Outlet } from 'react-router-dom';

function FeaturesLayout(): React.JSX.Element {
  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar className="flex flex-col gap-4" width="sm">
        <Link to="/features">
          <h2>Features</h2>
        </Link>
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            <NavigationMenuItemWithLink asChild>
              <NavLink to="/features/auth">
                <div className="flex items-center gap-2">
                  <MdPeople />
                  Authentication
                </div>
              </NavLink>
            </NavigationMenuItemWithLink>
          </NavigationMenuList>
        </NavigationMenu>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="p-4">
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}

export default FeaturesLayout;
