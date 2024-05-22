import { NavigationMenu, SidebarLayout } from '@halfdomelabs/ui-components';
import { MdWidgets } from 'react-icons/md';
import { NavLink, Outlet } from 'react-router-dom';

function PluginsLayout(): JSX.Element {
  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar className="space-y-4" width="sm">
        <h2>Plugins</h2>
        <NavigationMenu orientation="vertical">
          <NavigationMenu.List>
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to="/plugins">
                <MdWidgets />
                Manage Plugins
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

export default PluginsLayout;
