import type React from 'react';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
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
      <SidebarLayout.Sidebar className="flex flex-col gap-4" width="sm">
        <Link to="/plugins">
          <Button variant="secondary" className="w-full" size="sm">
            <MdAdd />
            Add new plugin
          </Button>
        </Link>
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            {enabledPlugins.map((plugin) => (
              <NavigationMenuLink key={plugin.id} asChild>
                <NavLink to={`/plugins/edit/${plugin.id}`}>
                  {plugin.displayName}
                </NavLink>
              </NavigationMenuLink>
            ))}
            {enabledPlugins.length === 0 && (
              <NavigationMenuItem className="mt-4 w-full text-center opacity-80">
                No plugins enabled
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="p-4">
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}

export default PluginsLayout;
