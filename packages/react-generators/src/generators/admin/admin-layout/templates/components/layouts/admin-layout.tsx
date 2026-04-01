// @ts-nocheck

import type React from 'react';
import type { ReactElement } from 'react';

import { AppBreadcrumbs } from '$appBreadcrumbs';
import { AppSidebar } from '$appSidebar';
import {
  Separator,
  SidebarInset,
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
    <SidebarProvider
      className={className}
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
            />
            <AppBreadcrumbs />
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <main className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <AsyncBoundary>
                <Outlet />
              </AsyncBoundary>
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
