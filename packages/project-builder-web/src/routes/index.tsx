import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  appEntityType,
  libraryEntityType,
  modelEntityType,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@baseplate-dev/ui-components';
import { createFileRoute, Link } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { useEffect, useState } from 'react';
import { MdExtension } from 'react-icons/md';

import { useProjects } from '#src/hooks/use-projects.js';
import { IS_PREVIEW } from '#src/services/config.js';
import { getPluginStaticUrl } from '#src/services/plugins.js';
import { trpc } from '#src/services/trpc.js';

export const Route = createFileRoute('/')({
  component: Index,
});

const MAX_PREVIEW_ITEMS = 5;

function Index(): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();
  const { currentProjectId } = useProjects();

  const webConfigImplementation = pluginContainer.use(webConfigSpec);

  const [pluginMetadata, setPluginMetadata] = useState<
    PluginMetadataWithPaths[] | null
  >(null);

  useEffect(() => {
    setPluginMetadata(null);
    if (!currentProjectId || IS_PREVIEW) {
      return;
    }
    trpc.plugins.getAvailablePlugins
      .mutate({ projectId: currentProjectId })
      .then(setPluginMetadata)
      .catch(() => {
        // silently fail — fall back to raw plugin names
      });
  }, [currentProjectId]);

  const projectName = definition.settings.general.name;

  const sortedModels = sortBy(definition.models, [(m) => m.name]);
  const previewModels = sortedModels.slice(0, MAX_PREVIEW_ITEMS);
  const extraModelCount = Math.max(0, sortedModels.length - MAX_PREVIEW_ITEMS);

  const sortedApps = sortBy(definition.apps, [(a) => a.name]);
  const sortedLibraries = sortBy(definition.libraries, [(l) => l.name]);
  const allPackages: (
    | { kind: 'app'; id: string; name: string; type: string }
    | { kind: 'lib'; id: string; name: string; type: string }
  )[] = [
    ...sortedApps.map((a) => ({
      kind: 'app' as const,
      id: a.id,
      name: a.name,
      type: a.type,
    })),
    ...sortedLibraries.map((l) => ({
      kind: 'lib' as const,
      id: l.id,
      name: l.name,
      type: l.type,
    })),
  ];
  const sortedPackages = sortBy(allPackages, [(p) => p.name]);
  const previewPackages = sortedPackages.slice(0, MAX_PREVIEW_ITEMS);
  const extraPackageCount = Math.max(
    0,
    sortedPackages.length - MAX_PREVIEW_ITEMS,
  );

  const pluginConfigs = definition.plugins ?? [];
  const previewPluginConfigs = pluginConfigs.slice(0, MAX_PREVIEW_ITEMS);
  const extraPluginCount = Math.max(
    0,
    pluginConfigs.length - MAX_PREVIEW_ITEMS,
  );

  return (
    <div className="flex-1 bg-white">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Welcome header */}
        <div className="space-y-2">
          <h1>Welcome to Baseplate</h1>
          {projectName && (
            <p className="text-lg font-medium text-muted-foreground">
              {projectName}
            </p>
          )}
          <p className="text-muted-foreground">
            Configure your project, then sync to generate code.
          </p>
          <div className="flex gap-3 pt-1">
            <a
              href="https://docs.baseplate.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Documentation ↗
            </a>
            <a
              href="https://github.com/halfdomelabs/baseplate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              GitHub ↗
            </a>
          </div>
        </div>

        {/* Top row: Models + Packages */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Models card */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Models
                  </CardTitle>
                  <CardDescription>
                    Define the data your app stores and manipulates.
                  </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link to="/data">
                    <Button variant="ghost" size="sm">
                      View all →
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {sortedModels.length === 0 ? (
                <Empty className="border-0 p-0">
                  <EmptyHeader>
                    <EmptyTitle>No models yet</EmptyTitle>
                    <EmptyDescription>
                      Add a model to define your app&apos;s data.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Link to="/data">
                      <Button size="sm">Go to Models</Button>
                    </Link>
                  </EmptyContent>
                </Empty>
              ) : (
                <ul className="space-y-1">
                  {previewModels.map((model) => (
                    <li key={model.id}>
                      <Link
                        to="/data/models/edit/$key"
                        params={{ key: modelEntityType.keyFromId(model.id) }}
                        className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-accent"
                      >
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.model.fields.length} field
                          {model.model.fields.length === 1 ? '' : 's'}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {extraModelCount > 0 && (
                    <li>
                      <Link
                        to="/data"
                        className="px-2 py-1 text-xs text-muted-foreground hover:underline"
                      >
                        +{extraModelCount} more
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Packages card */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Packages
                  </CardTitle>
                  <CardDescription>
                    Apps and libraries that make up your monorepo.
                  </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link to="/packages">
                    <Button variant="ghost" size="sm">
                      View all →
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {sortedPackages.length === 0 ? (
                <Empty className="border-0 p-0">
                  <EmptyHeader>
                    <EmptyTitle>No packages yet</EmptyTitle>
                    <EmptyDescription>
                      Create an app or library to get started.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Link to="/packages">
                      <Button size="sm">Go to Packages</Button>
                    </Link>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="space-y-2">
                  {previewPackages.map((pkg) => (
                    <Link
                      key={pkg.id}
                      to={
                        pkg.kind === 'app'
                          ? '/packages/apps/$key'
                          : '/packages/libs/$key'
                      }
                      params={{
                        key:
                          pkg.kind === 'app'
                            ? appEntityType.keyFromId(pkg.id)
                            : libraryEntityType.keyFromId(pkg.id),
                      }}
                      className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent/50"
                    >
                      <span>{pkg.name}</span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        title={pkg.type}
                      >
                        {pkg.type.length > 30
                          ? `...${pkg.type.slice(-30)}`
                          : pkg.type}
                      </Badge>
                    </Link>
                  ))}
                  {extraPackageCount > 0 && (
                    <Link
                      to="/packages"
                      className="block px-1 text-xs text-muted-foreground hover:underline"
                    >
                      +{extraPackageCount} more
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom row: Plugins (full width) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">
                  Plugins
                </CardTitle>
                <CardDescription>
                  Optional features like auth, email, and storage.
                </CardDescription>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link to="/plugins">
                  <Button variant="ghost" size="sm">
                    View all →
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pluginConfigs.length === 0 ? (
              <Empty className="border-0 p-0">
                <EmptyHeader>
                  <EmptyTitle>No plugins enabled</EmptyTitle>
                  <EmptyDescription>
                    Enable plugins to add features like auth and email.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link to="/plugins">
                    <Button size="sm">Browse Plugins</Button>
                  </Link>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="space-y-3">
                {previewPluginConfigs.map((pluginConfig) => {
                  const meta = pluginMetadata?.find(
                    (m) =>
                      m.packageName === pluginConfig.packageName &&
                      m.name === pluginConfig.name,
                  );
                  const hasWebConfig =
                    meta && webConfigImplementation.components.has(meta.key);
                  return (
                    <div
                      key={`${pluginConfig.packageName}:${pluginConfig.name}`}
                      className="flex items-center justify-between gap-4 rounded-md border bg-card px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg border">
                          {meta?.icon && currentProjectId ? (
                            <img
                              src={getPluginStaticUrl(
                                currentProjectId,
                                meta.key,
                                meta.icon,
                              )}
                              className="size-10 rounded-lg bg-muted"
                              alt={`${meta.displayName} logo`}
                            />
                          ) : (
                            <MdExtension className="size-10 bg-muted p-2" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {meta?.displayName ?? pluginConfig.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pluginConfig.packageName}
                          </p>
                        </div>
                      </div>
                      {hasWebConfig && (
                        <Link
                          to="/plugins/edit/$key"
                          params={{ key: meta.key }}
                        >
                          <Button variant="secondary" size="sm">
                            Configure
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
                {extraPluginCount > 0 && (
                  <Link
                    to="/plugins"
                    className="block px-1 text-xs text-muted-foreground hover:underline"
                  >
                    +{extraPluginCount} more
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
