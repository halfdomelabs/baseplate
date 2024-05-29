import { Breadcrumb, Button, Sheet } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { Fragment } from 'react';
import { MdMenu } from 'react-icons/md';
import { Link, NavLink, Outlet, useMatches } from 'react-router-dom';

import { AppDesktopSidebar } from './AppDesktopSidebar';
import { AppMobileSidebar } from './AppMobileSidebar';
import { useProjectDefinition } from '@src/hooks/useProjectDefinition';
import { RouteCrumbOrFunction } from '@src/types/routes';
import { notEmpty } from '@src/utils/array';

interface AppLayoutProps {
  className?: string;
}

/**
 * App layout with sidebar based on ShadnCn blocks
 *
 * See https://ui.shadcn.com/blocks
 */
export function AppLayout({ className }: AppLayoutProps): JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  const matches = useMatches();
  const crumbs = matches
    .map((match) => {
      const crumbOrFunction = (
        match.handle as { crumb?: RouteCrumbOrFunction } | undefined
      )?.crumb;
      if (!crumbOrFunction) return null;
      const crumb =
        typeof crumbOrFunction === 'function'
          ? crumbOrFunction(match.params, definitionContainer)
          : crumbOrFunction;
      const { label, url } =
        typeof crumb === 'string' ? { label: crumb, url: undefined } : crumb;
      return { id: match.id, label, url };
    })
    .filter(notEmpty);

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
      <div className="flex flex-col gap-4 pl-[70px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:px-6">
          <Sheet>
            <Sheet.Trigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <MdMenu className="size-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </Sheet.Trigger>
            <Sheet.Content side="left" className="sm:max-w-xs">
              <AppMobileSidebar />
            </Sheet.Content>
          </Sheet>
          <div className="py-4">
            <Breadcrumb>
              <Breadcrumb.List>
                <Breadcrumb.Item>
                  <Link to="/">
                    {definitionContainer.definition.name} project
                  </Link>
                </Breadcrumb.Item>
                {crumbs.map((crumb, index) => (
                  <Fragment key={crumb.id}>
                    <Breadcrumb.Separator />
                    {index === crumbs.length - 1 ? (
                      <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
                    ) : (
                      <Breadcrumb.Item>
                        {crumb.url ? (
                          <Breadcrumb.Link asChild>
                            <NavLink to={crumb.url}>{crumb.label}</NavLink>
                          </Breadcrumb.Link>
                        ) : (
                          crumb.label
                        )}
                      </Breadcrumb.Item>
                    )}
                  </Fragment>
                ))}
              </Breadcrumb.List>
            </Breadcrumb>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
