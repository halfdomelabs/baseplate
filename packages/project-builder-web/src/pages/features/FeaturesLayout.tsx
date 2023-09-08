import { NavigationLink, SidebarLayout } from '@halfdomelabs/ui-components';
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
        <NavigationLink
          as={NavLink}
          to="/features/auth"
          icon={MdPeople}
          className="w-full"
        >
          Authentication
        </NavigationLink>
        <NavigationLink
          as={NavLink}
          to="/features/storage"
          icon={MdAttachFile}
          className="w-full"
        >
          Storage
        </NavigationLink>
        <NavigationLink
          as={NavLink}
          to="/features/theme"
          icon={FaPalette}
          className="w-full"
        >
          Theme
        </NavigationLink>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="p-4">
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}

export default FeaturesLayout;
