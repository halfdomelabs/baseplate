import type React from 'react';

import { adminSectionEntityType } from '@baseplate-dev/project-builder-lib';
import {
  NavigationMenu,
  NavigationMenuItemWithLink,
  NavigationMenuList,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '@baseplate-dev/ui-components';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';

import { registerEntityTypeUrl } from '#src/services/entity-type.js';

registerEntityTypeUrl(
  adminSectionEntityType,
  `/apps/edit/{parentKey}/sections/edit/{key}`,
);

export const Route = createFileRoute('/apps/edit/$key/admin/sections')({
  component: AdminAppEditSectionsPage,
});

function AdminAppEditSectionsPage(): React.JSX.Element {
  const { adminDefinition } = Route.useRouteContext();
  const { key } = Route.useParams();
  const sortedSections = sortBy(adminDefinition.sections ?? [], [
    (section) => section.name,
  ]);

  return (
    <SidebarLayout>
      <SidebarLayoutSidebar className="space-y-4" width="sm">
        <div className="flex items-center justify-between">
          <h2>Sections</h2>
        </div>
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            <li>
              <NavigationMenuItemWithLink asChild>
                <Link
                  to="/apps/edit/$key/admin/sections/$sectionKey"
                  from="/"
                  params={{
                    key,
                    sectionKey: 'new',
                  }}
                  className="text-green-500"
                >
                  New Section
                </Link>
              </NavigationMenuItemWithLink>
            </li>
            {sortedSections.map((section) => (
              <li key={section.id}>
                <NavigationMenuItemWithLink asChild>
                  <Link
                    to="/apps/edit/$key/admin/sections/$sectionKey"
                    from="/"
                    params={{
                      key,
                      sectionKey: adminSectionEntityType.keyFromId(section.id),
                    }}
                  >
                    {section.name}
                  </Link>
                </NavigationMenuItemWithLink>
              </li>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </SidebarLayoutSidebar>
      <SidebarLayoutContent className="p-4">
        <Outlet />
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}
