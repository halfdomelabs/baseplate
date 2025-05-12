import type React from 'react';

import { appEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Button, Card, EmptyDisplay } from '@halfdomelabs/ui-components';
import { sortBy } from 'es-toolkit';
import { MdApps } from 'react-icons/md';
import { Link } from 'react-router-dom';

export function AppsListPage(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const { apps } = definition;
  const sortedApps = sortBy(apps, [(app) => app.name]);

  if (sortedApps.length === 0) {
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
          <Card key={app.id} className="flex justify-between space-x-4 p-4">
            <div>
              <h3>
                {app.name} ({app.type})
              </h3>
              <p className="text-xs text-muted-foreground">
                {app.packageLocation}
              </p>
            </div>
            <Link
              to={`/apps/edit/${appEntityType.toUid(app.id)}`}
              className="inline-block"
            >
              <Button variant="secondary">Edit</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
