import type React from 'react';

import {
  appEntityType,
  AppUtils,
  libraryEntityType,
  LibraryUtils,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  PageHeader,
  PageHeaderTitle,
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
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

  const { apps, libraries } = definition;
  const monorepoSettings = definition.settings.monorepo;
  const sortedApps = sortBy(apps, [(app) => app.name]);
  const sortedLibraries = sortBy(libraries, [(lib) => lib.name]);

  if (sortedApps.length === 0 && sortedLibraries.length === 0) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MdApps />
          </EmptyMedia>
          <EmptyTitle>No Apps or Packages</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any apps or packages yet
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NewDialog trigger={<Button>Create New</Button>} />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <PageHeader>
        <PageHeaderTitle>Packages</PageHeaderTitle>
      </PageHeader>
      <Section>
        <SectionHeader>
          <SectionTitle>Apps</SectionTitle>
          <SectionDescription>
            These are the apps that are defined in your project.
          </SectionDescription>
        </SectionHeader>
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
                      <CardTitle
                        render={<h3 />}
                        className="text-xl tracking-tight"
                      >
                        {app.name}
                      </CardTitle>
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
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Libraries</SectionTitle>
          <SectionDescription>
            Library packages that can be shared across apps.
          </SectionDescription>
        </SectionHeader>
        {sortedLibraries.length > 0 ? (
          <div className="mt-4 flex max-w-xl flex-col gap-4">
            {sortedLibraries.map((lib) => {
              const libDirectory = LibraryUtils.getLibraryDirectory(
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
                      <CardTitle
                        render={<h3 />}
                        className="text-xl tracking-tight"
                      >
                        {lib.name}
                      </CardTitle>
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
      </Section>
    </div>
  );
}
