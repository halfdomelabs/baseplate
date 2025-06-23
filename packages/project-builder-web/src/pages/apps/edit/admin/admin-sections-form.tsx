import type { AdminAppConfig } from '@baseplate-dev/project-builder-lib';
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
import { sortBy } from 'es-toolkit';
import { Link, Route, Routes } from 'react-router-dom';

import { registerEntityTypeUrl } from '#src/services/entity-type.js';

import AdminEditSectionForm from './admin-edit-section-form.js';

registerEntityTypeUrl(
  adminSectionEntityType,
  `/apps/edit/{parentKey}/sections/edit/{key}`,
);

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminSectionsForm({ className, appConfig }: Props): React.JSX.Element {
  const sortedSections = sortBy(appConfig.sections ?? [], [
    (section) => section.name,
  ]);

  return (
    <SidebarLayout className={className}>
      <SidebarLayoutSidebar className="space-y-4" width="sm">
        <div className="flex items-center justify-between">
          <h2>Sections</h2>
        </div>
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            <li>
              <NavigationMenuItemWithLink asChild>
                <Link to="new" className="text-green-500">
                  New Section
                </Link>
              </NavigationMenuItemWithLink>
            </li>
            {sortedSections.map((section) => (
              <li key={section.id}>
                <NavigationMenuItemWithLink asChild>
                  <Link
                    to={`edit/${adminSectionEntityType.keyFromId(section.id)}`}
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
        <Routes>
          <Route
            path="new"
            element={<AdminEditSectionForm key="new" appConfig={appConfig} />}
          />
          <Route
            path="edit/:sectionId"
            element={<AdminEditSectionForm appConfig={appConfig} />}
          />
        </Routes>
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}

export default AdminSectionsForm;
