import type React from 'react';

import {
  appEntityType,
  AppUtils,
  libraryEntityType,
  PackageUtils,
} from '@baseplate-dev/project-builder-lib';
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

import { NewDialog } from './-components/new-dialog.js';

export const Route = createFileRoute('/packages/')({
  component: PackagesListPage,
});

function PackagesListPage(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const { apps, libraries = [] } = definition;
  const monorepoSettings = definition.settings.monorepo;
  const sortedApps = sortBy(apps, [(app) => app.name]);
  const sortedLibraries = sortBy(libraries, [(lib) => lib.name]);

  if (sortedApps.length === 0 && sortedLibraries.length === 0) {
    return (
      <EmptyDisplay
        icon={MdApps}
        header="No Apps or Packages"
        subtitle="You haven't created any apps or packages yet"
        actions={
          <NewDialog>
            <Button>Create New</Button>
          </NewDialog>
        }
      />
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Apps Section */}
      <section className="space-y-4">
        <h1>Apps</h1>
        <p className="text-muted-foreground">
          These are the apps that are defined in your project.
        </p>
        {sortedApps.length > 0 ? (
          <div className="mt-4 flex max-w-xl flex-col gap-4">
            {sortedApps.map((app) => {
              const appDirectory = AppUtils.getAppDirectory(
                app,
                monorepoSettings,
              );
              return (
                <Link
                  key={app.id}
                  to="/packages/apps/$key"
                  params={{ key: appEntityType.keyFromId(app.id) }}
                >
                  <Card className="cursor-pointer p-4 transition-colors hover:bg-accent/50">
                    <div className="flex items-center justify-between">
                      <h3>{app.name}</h3>
                      <Badge variant="secondary">{app.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Location: {appDirectory}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No apps yet.</p>
        )}
      </section>

      {/* Libraries Section */}
      <section className="space-y-4">
        <h2>Libraries</h2>
        <p className="text-muted-foreground">
          Library packages that can be shared across apps.
        </p>
        {sortedLibraries.length > 0 ? (
          <div className="mt-4 flex max-w-xl flex-col gap-4">
            {sortedLibraries.map((lib) => {
              const libDirectory = PackageUtils.getLibraryDirectory(
                lib,
                monorepoSettings,
              );
              return (
                <Link
                  key={lib.id}
                  to="/packages/libs/$key"
                  params={{ key: libraryEntityType.keyFromId(lib.id) }}
                >
                  <Card className="cursor-pointer p-4 transition-colors hover:bg-accent/50">
                    <div className="flex items-center justify-between">
                      <h3>{lib.name}</h3>
                      <Badge variant="secondary">{lib.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Location: {libDirectory}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No libraries yet.
          </p>
        )}
      </section>
    </div>
  );
}
