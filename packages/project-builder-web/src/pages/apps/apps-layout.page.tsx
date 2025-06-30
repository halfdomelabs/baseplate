import type React from 'react';

import { appEntityType } from '@baseplate-dev/project-builder-lib';
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
import { sortBy } from 'es-toolkit';
import { MdAdd } from 'react-icons/md';
import { Link, NavLink, Outlet } from 'react-router-dom';

function AppsLayout(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const { apps } = definition;
  const sortedApps = sortBy(apps, [(app) => app.name]);

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayoutSidebar className="space-y-4" width="sm">
        <div className="flex flex-col gap-4">
          <Link to="/apps/new" className="inline-block w-full">
            <Button variant="secondary" className="w-full">
              <MdAdd />
              New App
            </Button>
          </Link>
        </div>
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            {sortedApps.map((app) => (
              <NavigationMenuItemWithLink key={app.id} asChild>
                <NavLink to={`/apps/edit/${appEntityType.keyFromId(app.id)}`}>
                  {app.name}
                </NavLink>
              </NavigationMenuItemWithLink>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </SidebarLayoutSidebar>
      <SidebarLayoutContent>
        <Outlet />
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}

export default AppsLayout;
