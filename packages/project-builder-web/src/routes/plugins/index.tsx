import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { EmptyDisplay, ErrorableLoader } from '@baseplate-dev/ui-components';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useProjects } from '#src/hooks/use-projects.js';
import { IS_PREVIEW } from '#src/services/config.js';
import { trpc } from '#src/services/trpc.js';

import { PluginCard } from './-components/plugin-card.js';

export const Route = createFileRoute('/plugins/')({
  component: PluginsHomePage,
});

function PluginsHomePage(): React.JSX.Element {
  const { currentProjectId } = useProjects();
  const [plugins, setPlugins] = useState<PluginMetadataWithPaths[] | null>(
    null,
  );
  const { definition } = useProjectDefinition();
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    setPlugins(null);
    if (!currentProjectId) {
      return;
    }
    if (IS_PREVIEW) {
      setPlugins([]);
      return;
    }
    trpc.plugins.getAvailablePlugins
      .mutate({ projectId: currentProjectId })
      .then(setPlugins)
      .catch(setError);
  }, [currentProjectId]);

  if (!plugins) {
    return <ErrorableLoader error={error} />;
  }

  if (plugins.length === 0) {
    return (
      <EmptyDisplay
        header="No plugins available."
        subtitle="Please install plugins via package.json."
      />
    );
  }

  const pluginConfig = definition.plugins ?? [];

  // Filter out managed plugins from main sections
  const mainPlugins = plugins.filter((plugin) => !plugin.managedBy);
  const managedPlugins = plugins.filter((plugin) => plugin.managedBy);

  const installedPlugins = mainPlugins.filter((plugin) =>
    pluginConfig.some(
      (config) =>
        config.packageName === plugin.packageName &&
        config.name === plugin.name,
    ),
  );
  const uninstalledPlugins = mainPlugins.filter(
    (plugin) =>
      !plugin.hidden &&
      !pluginConfig.some(
        (config) =>
          config.packageName === plugin.packageName &&
          config.name === plugin.name,
      ),
  );

  // Group managed plugins by their manager
  const managedPluginsByManager = new Map<string, typeof managedPlugins>();
  for (const managedPlugin of managedPlugins) {
    const managerName = managedPlugin.managedBy;
    if (!managerName) continue;

    if (!managedPluginsByManager.has(managerName)) {
      managedPluginsByManager.set(managerName, []);
    }
    const existingPlugins = managedPluginsByManager.get(managerName);
    if (existingPlugins) {
      existingPlugins.push(managedPlugin);
    }
  }

  return (
    <div className="max-w-2xl space-y-4 p-4">
      <h1>Manage Plugins</h1>
      <p>
        Plugins are a way to extend the functionality of your project, such as
        adding authentication. You can enable, disable, and manage plugins from
        this page.
      </p>
      <p>
        To add additional plugins, you can install them to your root package
        with <strong>pnpm</strong>.
      </p>
      {installedPlugins.length === 0 ? null : (
        <>
          <h3>Active Plugins ({installedPlugins.length})</h3>
          {installedPlugins.map((plugin) => (
            <PluginCard key={plugin.key} plugin={plugin} isActive />
          ))}
        </>
      )}
      {uninstalledPlugins.length === 0 ? null : (
        <>
          <h3>Available Plugins ({uninstalledPlugins.length})</h3>
          {uninstalledPlugins.map((plugin) => (
            <PluginCard key={plugin.key} plugin={plugin} isActive={false} />
          ))}
        </>
      )}
      {managedPluginsByManager.size === 0 ? null : (
        <>
          <h3>Managed Plugins</h3>
          <p className="text-sm text-muted-foreground">
            These plugins are managed by their parent plugins and cannot be
            configured directly.
          </p>
          {[...managedPluginsByManager.entries()].map(
            ([managerName, managedPlugins]) => {
              // Find the manager plugin to get its display name
              const managerPlugin = plugins.find(
                (p) => p.fullyQualifiedName === managerName,
              );
              const managerDisplayName =
                managerPlugin?.displayName ?? managerName;

              return (
                <div key={managerName} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Managed by {managerDisplayName}
                  </h4>
                  {managedPlugins.map((plugin) => {
                    const isActive = pluginConfig.some(
                      (config) =>
                        config.packageName === plugin.packageName &&
                        config.name === plugin.name,
                    );
                    return (
                      <PluginCard
                        key={plugin.key}
                        plugin={plugin}
                        isActive={isActive}
                        managerPlugin={managerPlugin}
                      />
                    );
                  })}
                </div>
              );
            },
          )}
        </>
      )}
    </div>
  );
}
