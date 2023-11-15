import { NavigationMenu, SidebarLayout } from '@halfdomelabs/ui-components';
import { FaPalette } from 'react-icons/fa';
import { MdAttachFile, MdPeople } from 'react-icons/md';
import { Link, NavLink, Outlet } from 'react-router-dom';

function FeaturesLayout(): JSX.Element {
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
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to="/features/storage">
                <MdAttachFile />
                Storage
              </NavLink>
            </NavigationMenu.ItemWithLink>
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to="/features/theme">
                <FaPalette />
                Theme
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
