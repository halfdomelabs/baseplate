import { PluginConfigWithModule } from '@halfdomelabs/project-builder-lib';
import { EmptyDisplay, ErrorableLoader } from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';

import { PluginCard } from './PluginCard';
import { useProjects } from '@src/hooks/useProjects';
import { client } from '@src/services/api';

export function PluginsHomePage(): JSX.Element {
  const { currentProjectId } = useProjects();
  const [plugins, setPlugins] = useState<PluginConfigWithModule[] | null>(null);
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

  if (!plugins.length) {
    return (
      <EmptyDisplay
        header="No plugins available."
        subtitle="Please install plugins via package.json."
      />
    );
  }

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
      <h3>Installed Plugins</h3>
      {!plugins.length ? (
        <EmptyDisplay
          header="No plugins available."
          subtitle="Please install plugins via package.json."
        />
      ) : (
        plugins.map((plugin) => <PluginCard key={plugin.id} plugin={plugin} />)
      )}
    </div>
  );
}
