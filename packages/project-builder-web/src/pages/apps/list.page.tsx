import { Button, Card, EmptyDisplay } from '@halfdomelabs/ui-components';
import _ from 'lodash';
import { MdApps } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

export function AppsListPage(): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const { apps } = parsedProject.projectConfig;
  const sortedApps = _.sortBy(apps, (m) => m.name);

  if (!sortedApps.length) {
    return (
      <EmptyDisplay
        icon={MdApps}
        header="No Apps"
        subtitle="You haven't created any apps yet"
        actions={
          <Link to="/apps/new" className="inline-block">
            <Button>New App</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1>Apps</h1>
      <p>
        These are the apps that are defined in your project. You can edit them
        here.
      </p>
      <Link to="/apps/new" className="inline-block">
        <Button>New App</Button>
      </Link>
      <div className="max-w-xl space-y-4">
        {sortedApps.map((app) => (
          <Card key={app.uid} className="flex justify-between space-x-4 p-4">
            <div>
              <h3>
                {app.name} ({app.type})
              </h3>
              <p className="subtext">{app.packageLocation}</p>
            </div>
            <Link to={`/apps/edit/${app.uid}`} className="inline-block">
              <Button variant="secondary">Edit</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
