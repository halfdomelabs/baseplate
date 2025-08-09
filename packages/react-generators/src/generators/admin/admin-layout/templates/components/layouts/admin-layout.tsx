// @ts-nocheck

import type { ReactElement } from 'react';

import { AppSidebar } from '$appSidebar';
import { SidebarProvider, SidebarTrigger } from '%reactComponentsImports';
import { Outlet } from '@tanstack/react-router';

interface Props {
  className?: string;
}

export function AdminLayout({ className }: Props): ReactElement {
  return (
    <SidebarProvider className={className}>
      <AppSidebar />
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
