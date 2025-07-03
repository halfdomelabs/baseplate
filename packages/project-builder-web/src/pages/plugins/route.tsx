import type React from 'react';

import { pluginEntityType } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '@baseplate-dev/ui-components';
import { notEmpty } from '@baseplate-dev/utils';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { MdAdd } from 'react-icons/md';

import { ErrorBoundary, NavLink } from '#src/components/index.js';

export const Route = createFileRoute('/plugins')({
  component: PluginsLayout,
  beforeLoad: () => ({
    getTitle: () => 'Plugins',
  }),
});

function PluginsLayout(): React.JSX.Element {
  const { definition, schemaParserContext } = useProjectDefinition();

  const { availablePlugins } = schemaParserContext.pluginStore;

  const enabledPlugins = (definition.plugins ?? [])
    .map((plugin) => {
      const pluginWithMetadata = availablePlugins.find(
        (p) => p.metadata.id === pluginEntityType.keyFromId(plugin.id),
      );
      return pluginWithMetadata?.metadata;
    })
    .filter(notEmpty);

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayoutSidebar className="flex flex-col gap-4" width="sm">
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
                <NavLink to={`/plugins/edit/$id`} params={{ id: plugin.id }}>
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
      </SidebarLayoutSidebar>
      <SidebarLayoutContent className="h-[calc(100vh-var(--topbar-height)-1px)]">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}
