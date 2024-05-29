import { Button, Sheet } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { MdMenu } from 'react-icons/md';
import { Outlet } from 'react-router-dom';

import { AppBreadcrumbs } from './AppBreadcrumbs';
import { AppDesktopSidebar } from './AppDesktopSidebar';
import { AppMobileSidebar } from './AppMobileSidebar';
import ProjectSyncModal from '../components/ProjectSyncModal';

interface AppLayoutProps {
  className?: string;
}

/**
 * App layout with sidebar based on ShadnCn blocks
 *
 * See https://ui.shadcn.com/blocks
 */
export function AppLayout({ className }: AppLayoutProps): JSX.Element {
  return (
    <div
      className={clsx(
        'flex min-h-screen w-full flex-col bg-background',
        className,
      )}
    >
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-[70px] flex-col border-r bg-background sm:flex">
        <AppDesktopSidebar />
      </aside>
      <div className="flex flex-col gap-4 sm:pl-[70px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:px-6">
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
          <div className="flex w-full items-center justify-between py-4">
            <AppBreadcrumbs />
            <ProjectSyncModal />
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
