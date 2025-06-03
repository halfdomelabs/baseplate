import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { EmptyDisplay, ErrorableLoader } from '@baseplate-dev/ui-components';
import { useEffect, useState } from 'react';

import { useProjects } from '#src/hooks/useProjects.js';
import { IS_PREVIEW } from '#src/services/config.js';
import { trpc } from '#src/services/trpc.js';

import { PluginCard } from './PluginCard.js';

export function PluginsHomePage(): React.JSX.Element {
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
            <PluginCard key={plugin.id} plugin={plugin} isActive />
          ))}
        </>
      )}
      {uninstalledPlugins.length === 0 ? null : (
        <>
          <h3>Available Plugins ({uninstalledPlugins.length})</h3>
          {uninstalledPlugins.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} isActive={false} />
          ))}
        </>
      )}
    </div>
  );
}
