import { NavigationMenu, SidebarLayout } from '@halfdomelabs/ui-components';
import { NavLink, Outlet } from 'react-router-dom';

function SettingsLayout(): JSX.Element {
  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar className="space-y-4" width="sm">
        <div className="flex items-center justify-between space-x-4">
          <h2>Settings</h2>
        </div>
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
      <SidebarLayout.Content>
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}

export default SettingsLayout;
