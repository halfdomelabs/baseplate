import { Link } from '@tanstack/react-router';
import { AiOutlineOrderedList } from 'react-icons/ai';
import { BsCardChecklist } from 'react-icons/bs';
import { FaUserAlt } from 'react-icons/fa';
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
                  <Link to="/admin">
                    <MdHome />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/admin/accounts/users/user">
                    <FaUserAlt />
                    <span>User</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/admin/bull-board">
                    <AiOutlineOrderedList />
                    <span>Queues</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/admin/todos/todo-list">
                    <BsCardChecklist />
                    <span>Todo List</span>
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
