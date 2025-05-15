import type React from 'react';

import { appEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  NavigationMenu,
  NavigationMenuItemWithLink,
  NavigationMenuList,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '@halfdomelabs/ui-components';
import { sortBy } from 'es-toolkit';
import { Link, NavLink, Outlet } from 'react-router-dom';

function AppsLayout(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const { apps } = definition;
  const sortedApps = sortBy(apps, [(app) => app.name]);

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayoutSidebar className="space-y-4" width="sm">
        <div className="flex items-center justify-between space-x-4">
          <Link to="/apps">
            <h2>Apps</h2>
          </Link>
          <Link to="/apps/new" className="inline-block">
            <Button variant="secondary">New App</Button>
          </Link>
        </div>
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            {sortedApps.map((app) => (
              <NavigationMenuItemWithLink key={app.id} asChild>
                <NavLink to={`/apps/edit/${appEntityType.toUid(app.id)}`}>
                  {app.name}
                </NavLink>
              </NavigationMenuItemWithLink>
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

export default AppsLayout;
