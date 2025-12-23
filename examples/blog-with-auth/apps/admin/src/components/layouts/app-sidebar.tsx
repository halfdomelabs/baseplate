import { Link } from '@tanstack/react-router';
import { FaUser } from 'react-icons/fa';
import { MdHome, MdLogout } from 'react-icons/md';

import { useLogOut } from '@src/hooks/use-log-out';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';

export function AppSidebar(): React.ReactElement {
  const logOut = useLogOut();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <h2>Admin Dashboard</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* TPL_SIDEBAR_LINKS:START */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/admin" activeOptions={{ exact: true }}>
                    <MdHome />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/admin/accounts/users">
                    <FaUser />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* TPL_SIDEBAR_LINKS:END */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logOut}>
                  <MdLogout />
                  <span>Log Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
