import { appEntityType } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  NavigationMenu,
  SidebarLayout,
} from '@halfdomelabs/ui-components';
import _ from 'lodash';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useProjectConfig } from 'src/hooks/useProjectConfig';

function AppsLayout(): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const { apps } = parsedProject.projectConfig;
  const sortedApps = _.sortBy(apps, (m) => m.name);

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar className="space-y-4" width="sm">
        <div className="flex items-center justify-between space-x-4">
          <Link to="/apps">
            <h2>Apps</h2>
          </Link>
          <Link to="/apps/new" className="inline-block">
            <Button variant="secondary">New App</Button>
          </Link>
        </div>
        <NavigationMenu orientation="vertical">
          <NavigationMenu.List>
            {sortedApps.map((app) => (
              <li key={app.id}>
                <NavigationMenu.ItemWithLink asChild>
                  <NavLink to={`/apps/edit/${appEntityType.toUid(app.id)}`}>
                    {app.name}
                  </NavLink>
                </NavigationMenu.ItemWithLink>
              </li>
            ))}
          </NavigationMenu.List>
        </NavigationMenu>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className=" p-4">
        <div className="max-w-3xl">
          <Outlet />
        </div>
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}

export default AppsLayout;
