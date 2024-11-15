import type { PluginMetadataWithPaths } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { EmptyDisplay, ErrorableLoader } from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';

import { useProjects } from '@src/hooks/useProjects';
import { client } from '@src/services/api';

import { PluginCard } from './PluginCard';

export function PluginsHomePage(): React.JSX.Element {
  const { currentProjectId } = useProjects();
  const [plugins, setPlugins] = useState<PluginMetadataWithPaths[] | null>(
    null,
  );
  const { parsedProject } = useProjectDefinition();
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    setPlugins(null);
    if (!currentProjectId) {
      return;
    }
    client.plugins.getAvailablePlugins
      .mutate({ id: currentProjectId })
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

  const pluginConfig = parsedProject.projectDefinition.plugins ?? [];
  const installedPlugins = plugins.filter((plugin) =>
    pluginConfig.some(
      (config) =>
        config.packageName === plugin.packageName &&
        config.name === plugin.name,
    ),
  );
  const uninstalledPlugins = plugins.filter(
    (plugin) =>
      !pluginConfig.some(
        (config) =>
          config.packageName === plugin.packageName &&
          config.name === plugin.name,
      ),
  );

  return (
    <div className="max-w-2xl space-y-4">
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
          {plugins.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} isActive />
          ))}
        </>
      )}
      {uninstalledPlugins.length === 0 ? null : (
        <>
          <h3>Available Plugins ({uninstalledPlugins.length})</h3>
          {plugins.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} isActive={false} />
          ))}
        </>
      )}
    </div>
  );
}
