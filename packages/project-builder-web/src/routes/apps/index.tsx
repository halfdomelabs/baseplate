import type React from 'react';

import { appEntityType, AppUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Badge,
  Button,
  Card,
  EmptyDisplay,
} from '@baseplate-dev/ui-components';
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
  const monorepoSettings = definition.settings.monorepo;
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
        {sortedApps.map((app) => {
          const appDirectory = AppUtils.getAppDirectory(app, monorepoSettings);
          return (
            <Card key={app.id} className="flex justify-between space-x-4 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3>{app.name}</h3>
                  <Badge variant="secondary">{app.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Location: {appDirectory}
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
          );
        })}
      </div>
    </div>
  );
}
