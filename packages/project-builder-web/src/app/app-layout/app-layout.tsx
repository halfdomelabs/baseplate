import type React from 'react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { MdMenu } from 'react-icons/md';
import { Outlet } from 'react-router-dom';

import { ErrorBoundary } from '#src/components/error-boundary/error-boundary.js';

import ProjectSyncModal from '../project-sync-modal/project-sync-modal.js';
import { AppBreadcrumbs } from './app-breadcrumbs.js';
import { AppDesktopSidebar } from './app-desktop-sidebar.js';
import { AppMobileSidebar } from './app-mobile-sidebar.js';
import { ProjectSyncStatus } from './project-sync-status.js';

interface AppLayoutProps {
  className?: string;
}

/**
 * App layout with sidebar based on ShadnCn blocks
 *
 * See https://ui.shadcn.com/blocks
 */
export function AppLayout({ className }: AppLayoutProps): React.JSX.Element {
  return (
    <div
      className={clsx(
        'flex h-screen w-full min-w-(--min-app-width) flex-col bg-background',
        className,
      )}
      style={
        {
          '--sidebar-width': '70px',
          '--topbar-height': '52px',
          '--action-bar-height': '52px',
          '--min-app-width': '800px',
        } as React.CSSProperties
      }
    >
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-(--sidebar-width) flex-col border-r bg-background sm:flex">
        <AppDesktopSidebar />
      </aside>
      <div className="flex h-full flex-col pt-(--topbar-height) sm:pl-(--sidebar-width)">
        <header className="fixed inset-x-0 top-0 z-30 flex h-(--topbar-height) items-center gap-4 border-b bg-background px-4 sm:left-(--sidebar-width) sm:px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <MdMenu className="size-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="max-w-xs">
              <AppMobileSidebar />
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center justify-between py-3">
            <AppBreadcrumbs />
            <div className="flex items-center gap-4">
              <ProjectSyncStatus />
              <ProjectSyncModal />
            </div>
          </div>
        </header>
        <main className="h-[calc(100vh-var(--topbar-height)-1px)] overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
