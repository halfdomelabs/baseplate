import type React from 'react';

import {
  appEntityType,
  libraryEntityType,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from '@baseplate-dev/ui-components';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { MdAdd } from 'react-icons/md';

import { CollapsibleAppSidebarItem } from './-components/collapsible-app-sidebar-item.js';
import { NewDialog } from './-components/new-dialog.js';

export const Route = createFileRoute('/packages')({
  component: PackagesLayout,
  beforeLoad: () => ({
    getTitle: () => 'Packages',
  }),
});

function PackagesLayout(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const { apps, libraries } = definition;
  const sortedApps = sortBy(apps, [(app) => app.name]);
  const sortedLibraries = sortBy(libraries, [(lib) => lib.name]);

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayoutSidebar className="space-y-4" width="sm">
        <NewDialog
          trigger={
            <Button variant="secondary" className="w-full">
              <MdAdd />
              New
            </Button>
          }
        />

        {/* Apps Section */}
        {sortedApps.length > 0 && (
          <>
            <h4 className="px-2 text-sm font-medium text-muted-foreground">
              Apps
            </h4>
            <SidebarMenu>
              {sortedApps.map((app) => {
                const appKey = appEntityType.keyFromId(app.id);
                if (app.type === 'web' && app.adminApp.enabled) {
                  return (
                    <CollapsibleAppSidebarItem
                      key={app.id}
                      appId={app.id}
                      appName={app.name}
                      appKey={appKey}
                      sections={app.adminApp.sections}
                    />
                  );
                }
                return (
                  <SidebarMenuItem key={app.id}>
                    <SidebarMenuSubButton
                      render={
                        <Link
                          to="/packages/apps/$key"
                          params={{ key: appKey }}
                        />
                      }
                    >
                      <span>{app.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </>
        )}

        {/* Libraries Section */}
        {sortedLibraries.length > 0 && (
          <>
            <h4 className="mt-2 px-2 text-sm font-medium text-muted-foreground">
              Libraries
            </h4>
            <SidebarMenu>
              {sortedLibraries.map((lib) => (
                <SidebarMenuItem key={lib.id}>
                  <SidebarMenuSubButton
                    render={
                      <Link
                        to="/packages/libs/$key"
                        params={{ key: libraryEntityType.keyFromId(lib.id) }}
                      />
                    }
                  >
                    <span>{lib.name}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </>
        )}
      </SidebarLayoutSidebar>
      <SidebarLayoutContent>
        <Outlet />
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}
