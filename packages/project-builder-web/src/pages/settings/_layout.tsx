import type React from 'react';

import { NavigationMenu, SidebarLayout } from '@halfdomelabs/ui-components';
import { NavLink, Outlet } from 'react-router-dom';

function SettingsLayout(): React.JSX.Element {
  return (
    <SidebarLayout className="h-full flex-1">
      <SidebarLayout.Sidebar className="space-y-4" width="sm">
        <NavigationMenu orientation="vertical">
          <NavigationMenu.List>
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to={`/settings/project-settings`}>
                Project settings
              </NavLink>
            </NavigationMenu.ItemWithLink>
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to={`/settings/hierarchy`}>Hierarchy</NavLink>
            </NavigationMenu.ItemWithLink>
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to={`/settings/theme-builder`}>Theme builder</NavLink>
            </NavigationMenu.ItemWithLink>
          </NavigationMenu.List>
        </NavigationMenu>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="h-full">
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}

export default SettingsLayout;
