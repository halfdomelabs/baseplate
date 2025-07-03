import type React from 'react';

import { appEntityType } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { Button, Card, EmptyDisplay } from '@baseplate-dev/ui-components';
import { createFileRoute, Link } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { MdApps } from 'react-icons/md';

import NewAppDialog from './-components/new-app-dialog.js';

export const Route = createFileRoute('/apps/')({
  component: AppsListPage,
});

function AppsListPage(): React.JSX.Element {
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
          <NewAppDialog>
            <Button>New App</Button>
          </NewAppDialog>
        }
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h1>Apps</h1>
      <p>
        These are the apps that are defined in your project. You can edit them
        here.
      </p>
      <NewAppDialog>
        <Button>New App</Button>
      </NewAppDialog>
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
              to="/apps/edit/$key"
              params={{ key: appEntityType.keyFromId(app.id) }}
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
