import {
  Button,
  NavigationLink,
  SidebarLayout,
} from '@halfdomelabs/ui-components';
import _ from 'lodash';
import { Link, Outlet } from 'react-router-dom';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

function AppsLayout(): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const { apps } = parsedProject.projectConfig;
  const sortedApps = _.sortBy(apps, (m) => m.name);

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar className="space-y-4" width="sm">
        <h2>Apps</h2>
        <Link to="/apps/new" className="inline-block">
          <Button variant="secondary" size="sm">
            New App
          </Button>
        </Link>
        <ul className="space-y-2">
          {sortedApps.map((app) => (
            <li key={app.uid}>
              <NavigationLink
                as={Link}
                to={`/apps/edit/${app.uid}`}
                className="w-full"
              >
                {app.name}
              </NavigationLink>
            </li>
          ))}
        </ul>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="p-4">
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}

export default AppsLayout;
