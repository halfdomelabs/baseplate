// @ts-nocheck

import type { ReactElement } from 'react';

import { useLogOut } from '%authHooksImports';
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
  SidebarProvider,
  SidebarTrigger,
} from '%reactComponentsImports';
import { Outlet } from '@tanstack/react-router';
import { MdLogout } from 'react-icons/md';

interface Props {
  className?: string;
}

export function AdminLayout({ className }: Props): ReactElement {
  const logOut = useLogOut();

  return (
    <SidebarProvider className={className}>
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <h2>Admin Dashboard</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <TPL_SIDEBAR_LINKS />
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
      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center px-6">
          <SidebarTrigger />
          <h1 className="ml-4 text-lg font-semibold">Admin Dashboard</h1>
        </header>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
