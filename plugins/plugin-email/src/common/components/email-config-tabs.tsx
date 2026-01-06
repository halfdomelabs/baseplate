import { PluginUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  NavigationTabs,
  NavigationTabsItem,
} from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';

import type { EmailPluginDefinition } from '#src/email/core/schema/plugin-definition.js';

export function EmailConfigTabs(): React.ReactElement | null {
  const { definition, schemaParserContext } = useProjectDefinition();

  const emailPlugin = schemaParserContext.pluginStore.availablePlugins.find(
    (p) =>
      p.metadata.packageName === '@baseplate-dev/plugin-email' &&
      p.metadata.name === 'email',
  );

  if (!emailPlugin) {
    return null;
  }

  const emailConfig = PluginUtils.configByKey(
    definition,
    emailPlugin.metadata.key,
  ) as EmailPluginDefinition | undefined;

  const implementationPluginKey = emailConfig?.implementationPluginKey;

  const emailImplementationPlugin =
    schemaParserContext.pluginStore.availablePlugins.find(
      (p) => p.metadata.key === implementationPluginKey,
    );

  if (!emailImplementationPlugin) {
    return null;
  }

  return (
    <NavigationTabs>
      <NavigationTabsItem asChild>
        <Link
          to="/plugins/edit/$key"
          params={{ key: emailPlugin.metadata.key }}
          activeOptions={{ exact: true }}
        >
          Email
        </Link>
      </NavigationTabsItem>
      <NavigationTabsItem asChild>
        <Link
          to={`/plugins/edit/${emailImplementationPlugin.metadata.key}`}
          activeOptions={{ exact: true }}
        >
          {emailImplementationPlugin.metadata.displayName}
        </Link>
      </NavigationTabsItem>
    </NavigationTabs>
  );
}
