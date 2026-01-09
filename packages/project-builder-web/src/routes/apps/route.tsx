import type React from 'react';

import {
  appEntityType,
  libraryEntityType,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  NavigationMenu,
  NavigationMenuItemWithLink,
  NavigationMenuList,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '@baseplate-dev/ui-components';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { MdAdd } from 'react-icons/md';

import { NewDialog } from './-components/new-dialog.js';

export const Route = createFileRoute('/apps')({
  component: AppsLayout,
  beforeLoad: () => ({
    getTitle: () => 'Apps',
  }),
});

function AppsLayout(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const { apps, libraries = [] } = definition;
  const sortedApps = sortBy(apps, [(app) => app.name]);
  const sortedLibraries = sortBy(libraries, [(lib) => lib.name]);

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayoutSidebar className="space-y-4" width="sm">
        <NewDialog>
          <Button variant="secondary" className="w-full">
            <MdAdd />
            New
          </Button>
        </NewDialog>

        {/* Apps Section */}
        {sortedApps.length > 0 && (
          <>
            <h4 className="px-2 text-sm font-medium text-muted-foreground">
              Apps
            </h4>
            <NavigationMenu orientation="vertical">
              <NavigationMenuList>
                {sortedApps.map((app) => (
                  <NavigationMenuItemWithLink key={app.id} asChild>
                    <Link
                      to="/apps/edit/$key"
                      params={{ key: appEntityType.keyFromId(app.id) }}
                    >
                      {app.name}
                    </Link>
                  </NavigationMenuItemWithLink>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </>
        )}

        {/* Libraries Section */}
        {sortedLibraries.length > 0 && (
          <>
            <h4 className="mt-2 px-2 text-sm font-medium text-muted-foreground">
              Libraries
            </h4>
            <NavigationMenu orientation="vertical">
              <NavigationMenuList>
                {sortedLibraries.map((lib) => (
                  <NavigationMenuItemWithLink key={lib.id} asChild>
                    <Link
                      to="/apps/packages/$key"
                      params={{ key: libraryEntityType.keyFromId(lib.id) }}
                    >
                      {lib.name}
                    </Link>
                  </NavigationMenuItemWithLink>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </>
        )}
      </SidebarLayoutSidebar>
      <SidebarLayoutContent>
        <Outlet />
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}
