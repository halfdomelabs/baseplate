import type React from 'react';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  NavigationMenu,
  SidebarLayout,
} from '@halfdomelabs/ui-components';
import { notEmpty } from '@halfdomelabs/utils';
import { MdAdd } from 'react-icons/md';
import { Link, NavLink, Outlet } from 'react-router-dom';

function PluginsLayout(): React.JSX.Element {
  const { definition, schemaParserContext } = useProjectDefinition();

  const { availablePlugins } = schemaParserContext.pluginStore;

  const enabledPlugins = (definition.plugins ?? [])
    .map((plugin) => {
      const pluginWithMetadata = availablePlugins.find(
        (p) => p.metadata.id === plugin.id,
      );
      return pluginWithMetadata?.metadata;
    })
    .filter(notEmpty);

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar className="space-y-4" width="sm">
        <Link to="/plugins">
          <Button.WithIcon
            variant="secondary"
            icon={MdAdd}
            className="w-full"
            size="sm"
          >
            Add new plugin
          </Button.WithIcon>
        </Link>
        <NavigationMenu orientation="vertical">
          <NavigationMenu.List>
            {enabledPlugins.map((plugin) => (
              <NavigationMenu.ItemWithLink key={plugin.id} asChild>
                <NavLink to={`/plugins/edit/${plugin.id}`}>
                  {plugin.displayName}
                </NavLink>
              </NavigationMenu.ItemWithLink>
            ))}
            {enabledPlugins.length === 0 && (
              <NavigationMenu.Item className="mt-4 w-full text-center opacity-80">
                No plugins enabled
              </NavigationMenu.Item>
            )}
          </NavigationMenu.List>
        </NavigationMenu>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="p-4">
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}

export default PluginsLayout;
