import type React from 'react';

import { Button, Sheet } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { MdMenu } from 'react-icons/md';
import { Outlet } from 'react-router-dom';

import { ErrorBoundary } from '@src/components/ErrorBoundary/ErrorBoundary';

import ProjectSyncModal from '../components/ProjectSyncModal';
import { ProjectSyncStatus } from '../components/ProjectSyncStatus';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { AppDesktopSidebar } from './AppDesktopSidebar';
import { AppMobileSidebar } from './AppMobileSidebar';

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
        'flex h-screen w-full min-w-[var(--min-app-width)] flex-col bg-background',
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
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-[var(--sidebar-width)] flex-col border-r bg-background sm:flex">
        <AppDesktopSidebar />
      </aside>
      <div className="flex h-full flex-col pt-[var(--topbar-height)] sm:pl-[var(--sidebar-width)]">
        <header className="fixed inset-x-0 top-0 z-30 flex h-[var(--topbar-height)] items-center gap-4 border-b bg-background px-4 sm:left-[var(--sidebar-width)] sm:px-4">
          <Sheet>
            <Sheet.Trigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <MdMenu className="size-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </Sheet.Trigger>
            <Sheet.Content side="left" className="max-w-xs">
              <AppMobileSidebar />
            </Sheet.Content>
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
