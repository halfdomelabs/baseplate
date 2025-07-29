import { PluginUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  NavigationTabs,
  NavigationTabsItem,
} from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';

import type { AuthPluginDefinition } from '#src/auth/core/schema/plugin-definition.js';

export function AuthConfigTabs(): React.ReactElement | null {
  const { definition, schemaParserContext } = useProjectDefinition();

  const authPlugin = schemaParserContext.pluginStore.availablePlugins.find(
    (p) =>
      p.metadata.packageName === '@baseplate-dev/plugin-auth' &&
      p.metadata.name === 'auth',
  );

  if (!authPlugin) {
    return null;
  }

  const authConfig = PluginUtils.configByKey(
    definition,
    authPlugin.metadata.key,
  ) as AuthPluginDefinition | undefined;

  const implementationPluginKey = authConfig?.implementationPluginKey;

  const authImplementationPlugin =
    schemaParserContext.pluginStore.availablePlugins.find(
      (p) => p.metadata.key === implementationPluginKey,
    );

  if (!authImplementationPlugin) {
    return null;
  }

  return (
    <NavigationTabs>
      <NavigationTabsItem asChild>
        <Link
          to="/plugins/edit/$key"
          from="/"
          params={{ key: authPlugin.metadata.key }}
          activeOptions={{ exact: true }}
        >
          Auth
        </Link>
      </NavigationTabsItem>
      <NavigationTabsItem asChild>
        <Link
          to={`/plugins/edit/${authImplementationPlugin.metadata.key}`}
          activeOptions={{ exact: true }}
        >
          {authImplementationPlugin.metadata.displayName}
        </Link>
      </NavigationTabsItem>
    </NavigationTabs>
  );
}
