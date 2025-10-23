import type { ReactElement } from 'react';

import { Outlet } from '@tanstack/react-router';

import { Separator } from '../ui/separator';
import { SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { AppBreadcrumbs } from './app-breadcrumbs';
import { AppSidebar } from './app-sidebar';

interface Props {
  className?: string;
}

export function AdminLayout({ className }: Props): ReactElement {
  return (
    <SidebarProvider className={className}>
      <AppSidebar />
      <div className="flex h-full w-full flex-col">
        <header className="flex h-16 items-center gap-2 px-6">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <AppBreadcrumbs />
        </header>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
