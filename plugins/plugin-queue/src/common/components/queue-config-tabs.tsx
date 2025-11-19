import { PluginUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  NavigationTabs,
  NavigationTabsItem,
} from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';


export function QueueConfigTabs(): React.ReactElement | null {
  const { definition, schemaParserContext } = useProjectDefinition();

  const queuePlugin = schemaParserContext.pluginStore.availablePlugins.find(
    (p) =>
      p.metadata.packageName === '@baseplate-dev/plugin-queue' &&
      p.metadata.name === 'queue',
  );

  if (!queuePlugin) {
    return null;
  }

  const queueConfig = PluginUtils.configByKey(
    definition,
    queuePlugin.metadata.key,
  );

  const implementationPluginKey = queueConfig?.implementationPluginKey;

  const queueImplementationPlugin =
    schemaParserContext.pluginStore.availablePlugins.find(
      (p) => p.metadata.key === implementationPluginKey,
    );

  if (!queueImplementationPlugin) {
    return null;
  }

  return (
    <NavigationTabs>
      <NavigationTabsItem asChild>
        <Link
          to="/plugins/edit/$key"
          params={{ key: queuePlugin.metadata.key }}
          activeOptions={{ exact: true }}
        >
          Queue
        </Link>
      </NavigationTabsItem>
      <NavigationTabsItem asChild>
        <Link
          to={`/plugins/edit/${queueImplementationPlugin.metadata.key}`}
          activeOptions={{ exact: true }}
        >
          {queueImplementationPlugin.metadata.displayName}
        </Link>
      </NavigationTabsItem>
    </NavigationTabs>
  );
}
