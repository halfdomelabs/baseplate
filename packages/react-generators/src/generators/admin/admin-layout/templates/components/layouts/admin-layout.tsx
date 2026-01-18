// @ts-nocheck

import type { ReactElement } from 'react';

import { AppBreadcrumbs } from '$appBreadcrumbs';
import { AppSidebar } from '$appSidebar';
import {
  Separator,
  SidebarProvider,
  SidebarTrigger,
} from '%reactComponentsImports';
import { AsyncBoundary } from '%reactErrorBoundaryImports';
import { Outlet } from '@tanstack/react-router';

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
          <AsyncBoundary>
            <Outlet />
          </AsyncBoundary>
        </main>
      </div>
    </SidebarProvider>
  );
}
