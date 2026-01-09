import type React from 'react';

import {
  adminSectionEntityType,
  appEntityType,
} from '@baseplate-dev/project-builder-lib';
import {
  Button,
  NavigationMenu,
  NavigationMenuItemWithLink,
  NavigationMenuList,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { MdAdd, MdArrowBack } from 'react-icons/md';

import NewAdminSectionDialog from './-components/new-admin-section-dialog.js';

export const Route = createFileRoute('/admin-sections/$appKey')({
  component: AdminSectionsLayout,
  beforeLoad: ({ params: { appKey }, context: { projectDefinition } }) => {
    const appId = appEntityType.idFromKey(appKey);
    const app = appId
      ? projectDefinition.apps.find((a) => a.id === appId)
      : undefined;
    if (!app || app.type !== 'web') {
      return {};
    }
    const { adminApp } = app;
    return {
      getTitle: () => app.name,
      app,
      adminApp,
    };
  },
  loader: ({ context: { app, adminApp } }) => {
    if (!app) throw notFound();
    if (!adminApp)
      throw redirect({
        to: '/packages/apps/$key/web/admin',
        params: { key: appEntityType.keyFromId(app.id) },
      });
    return { app, adminApp };
  },
});

function AdminSectionsLayout(): React.JSX.Element {
  const { adminApp, app } = Route.useLoaderData();
  const { appKey } = Route.useParams();

  const sections = adminApp.sections ?? [];
  const sortedSections = sortBy(sections, [(section) => section.name]);

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayoutSidebar className="space-y-4" width="sm">
        {/* Header with back link */}
        <div className="flex flex-col gap-4">
          <Link
            to="/packages/apps/$key/web/admin"
            params={{ key: appKey }}
            className="flex items-center gap-2 text-sm hover:underline"
          >
            <MdArrowBack />
            Back to Admin Config
          </Link>

          <div>
            <h2 className="text-lg font-semibold">{app.name}</h2>
            <p className="text-sm text-muted-foreground">Admin Sections</p>
          </div>
        </div>

        {/* New Section Button */}
        <div className="flex flex-col gap-4">
          <NewAdminSectionDialog appId={app.id} appKey={appKey}>
            <Button variant="secondary" className="w-full">
              <MdAdd />
              New Section
            </Button>
          </NewAdminSectionDialog>
        </div>

        {/* Sections Navigation */}
        {sortedSections.length > 0 && (
          <NavigationMenu orientation="vertical">
            <NavigationMenuList>
              {sortedSections.map((section) => (
                <NavigationMenuItemWithLink key={section.id} asChild>
                  <Link
                    to="/admin-sections/$appKey/edit/$sectionKey"
                    params={{
                      appKey,
                      sectionKey: adminSectionEntityType.keyFromId(section.id),
                    }}
                  >
                    {section.name}
                  </Link>
                </NavigationMenuItemWithLink>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        )}
      </SidebarLayoutSidebar>

      <SidebarLayoutContent>
        <Outlet />
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}
