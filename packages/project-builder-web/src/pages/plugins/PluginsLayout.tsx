import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  NavigationMenu,
  SidebarLayout,
} from '@halfdomelabs/ui-components';
import { MdAdd } from 'react-icons/md';
import { Link, NavLink, Outlet } from 'react-router-dom';

import NotFoundPage from '../NotFound.page';
import { useFeatureFlag } from '@src/hooks/useFeatureFlag';
import { notEmpty } from '@src/utils/array';

function PluginsLayout(): JSX.Element {
  const isPluginsEnabled = useFeatureFlag('plugins');
  const { definition, schemaParserContext } = useProjectDefinition();

  if (!isPluginsEnabled) {
    return <NotFoundPage />;
  }

  const availablePlugins = schemaParserContext.pluginStore.availablePlugins;

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
        <NavigationMenu orientation="vertical">
          <NavigationMenu.List>
            <NavigationMenu.Item>
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
            </NavigationMenu.Item>
            {enabledPlugins.map((plugin) => (
              <NavigationMenu.Item key={plugin.id}>
                <NavLink to={`/plugins/edit/${plugin.id}`}>
                  <span>{plugin.name}</span>
                </NavLink>
              </NavigationMenu.Item>
            ))}
            {!enabledPlugins.length && (
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
