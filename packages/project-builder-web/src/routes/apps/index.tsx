import type React from 'react';

import {
  appEntityType,
  AppUtils,
  packageEntityType,
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

import NewAppDialog from './-components/new-app-dialog.js';
import NewPackageDialog from './-components/new-package-dialog.js';

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
          <div className="flex gap-2">
            <NewAppDialog>
              <Button>New App</Button>
            </NewAppDialog>
            <NewPackageDialog>
              <Button variant="outline">New Package</Button>
            </NewPackageDialog>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Apps Section */}
      <section>
        <h1>Apps</h1>
        <p className="text-muted-foreground">
          These are the apps that are defined in your project.
        </p>
        <div className="mt-4">
          <NewAppDialog>
            <Button>New App</Button>
          </NewAppDialog>
        </div>
        {sortedApps.length > 0 ? (
          <div className="mt-4 max-w-xl space-y-4">
            {sortedApps.map((app) => {
              const appDirectory = AppUtils.getAppDirectory(
                app,
                monorepoSettings,
              );
              return (
                <Card
                  key={app.id}
                  className="flex justify-between space-x-4 p-4"
                >
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
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No apps yet.</p>
        )}
      </section>

      {/* Packages Section */}
      <section>
        <h2>Packages</h2>
        <p className="text-muted-foreground">
          Library packages that can be shared across apps.
        </p>
        <div className="mt-4">
          <NewPackageDialog>
            <Button>New Package</Button>
          </NewPackageDialog>
        </div>
        {sortedPackages.length > 0 ? (
          <div className="mt-4 max-w-xl space-y-4">
            {sortedPackages.map((pkg) => {
              const pkgDirectory = PackageUtils.getPackageDirectory(
                pkg,
                monorepoSettings,
              );
              return (
                <Card
                  key={pkg.id}
                  className="flex justify-between space-x-4 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3>{pkg.name}</h3>
                      <Badge variant="secondary">{pkg.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Location: {pkgDirectory}
                    </p>
                  </div>
                  <Link
                    to="/apps/packages/$key"
                    params={{ key: packageEntityType.keyFromId(pkg.id) }}
                    className="inline-block"
                  >
                    <Button variant="secondary">Edit</Button>
                  </Link>
                </Card>
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
