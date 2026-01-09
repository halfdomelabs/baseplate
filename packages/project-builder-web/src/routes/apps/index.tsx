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

export const Route = createFileRoute('/apps/')({
  component: AppsListPage,
});

function AppsListPage(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const { apps, packages = [] } = definition;
  const monorepoSettings = definition.settings.monorepo;
  const sortedApps = sortBy(apps, [(app) => app.name]);
  const sortedPackages = sortBy(packages, [(pkg) => pkg.name]);

  if (sortedApps.length === 0 && sortedPackages.length === 0) {
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
                  to="/apps/edit/$key"
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

      {/* Packages Section */}
      <section className="space-y-4">
        <h2>Packages</h2>
        <p className="text-muted-foreground">
          Library packages that can be shared across apps.
        </p>
        {sortedPackages.length > 0 ? (
          <div className="mt-4 flex max-w-xl flex-col gap-4">
            {sortedPackages.map((pkg) => {
              const pkgDirectory = PackageUtils.getPackageDirectory(
                pkg,
                monorepoSettings,
              );
              return (
                <Link
                  key={pkg.id}
                  to="/apps/packages/$key"
                  params={{ key: libraryEntityType.keyFromId(pkg.id) }}
                >
                  <Card className="cursor-pointer p-4 transition-colors hover:bg-accent/50">
                    <div className="flex items-center justify-between">
                      <h3>{pkg.name}</h3>
                      <Badge variant="secondary">{pkg.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Location: {pkgDirectory}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No packages yet.</p>
        )}
      </section>
    </div>
  );
}
