import type React from 'react';

import { NavigationMenu, SidebarLayout } from '@halfdomelabs/ui-components';
import { MdPeople } from 'react-icons/md';
import { Link, NavLink, Outlet } from 'react-router-dom';

function FeaturesLayout(): React.JSX.Element {
  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar className="space-y-4" width="sm">
        <Link to="/features">
          <h2>Features</h2>
        </Link>
        <NavigationMenu orientation="vertical">
          <NavigationMenu.List>
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to="/features/auth">
                <MdPeople />
                Authentication
              </NavLink>
            </NavigationMenu.ItemWithLink>
          </NavigationMenu.List>
        </NavigationMenu>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="p-4">
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}

export default FeaturesLayout;
