import { PluginUtils, webConfigSpec } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Dropdown,
  toast,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import { useMemo } from 'react';
import { HiDotsVertical } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';

import { loadPluginImplementationStoreWithNewPlugin } from './utils';
import NotFoundPage from '../NotFound.page';

export function PluginConfigPage(): JSX.Element {
  const {
    definitionContainer,
    pluginContainer,
    schemaParserContext,
    setConfigAndFixReferences,
  } = useProjectDefinition();
  const { id } = useParams<'id'>();
  const { requestConfirm } = useConfirmDialog();
  const navigate = useNavigate();

  const pluginDefinition = PluginUtils.byId(
    definitionContainer.definition,
    id ?? '',
  );

  const Container = useMemo(() => {
    if (!id) {
      return;
    }

    const pluginSpec = pluginContainer.getPluginSpec(webConfigSpec);
    const webConfigComponent = pluginSpec.getWebConfigComponent(id);
    if (webConfigComponent) {
      return webConfigComponent;
    }
    // it may not be activated yet
    const plugin = schemaParserContext.pluginStore.availablePlugins.find(
      (p) => p.metadata.id === id,
    );
    if (!plugin) {
      return;
    }
    const newPluginContainer = loadPluginImplementationStoreWithNewPlugin(
      schemaParserContext.pluginStore,
      plugin.metadata,
      definitionContainer.definition,
    );

    return newPluginContainer
      .getPluginSpec(webConfigSpec)
      .getWebConfigComponent(id);
  }, [id, schemaParserContext, definitionContainer, pluginContainer]);

  const plugin = schemaParserContext.pluginStore.availablePlugins.find(
    (p) => p.metadata.id === id,
  );

  if (!Container || !plugin) {
    return <NotFoundPage />;
  }

  const { metadata } = plugin;

  function onDisablePlugin(): void {
    setConfigAndFixReferences((draft) => {
      draft.plugins = (draft.plugins ?? []).filter((p) => p.id !== metadata.id);
    });
    toast.success(`Disabled ${metadata.displayName}!`);
    navigate('/plugins');
  }

  function onSave(): void {
    if (!pluginDefinition) {
      navigate('/plugins');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1>{metadata.displayName} Plugin</h1>
        {pluginDefinition && (
          <Dropdown>
            <Dropdown.Trigger asChild>
              <Button variant="ghost" size="icon">
                <Button.Icon icon={HiDotsVertical} aria-label="More Actions" />
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Content>
              <Dropdown.Group>
                <Dropdown.Item
                  onSelect={() =>
                    requestConfirm({
                      title: 'Disable Plugin',
                      content: `Are you sure you want to disable the ${metadata.displayName} plugin?`,
                      onConfirm: onDisablePlugin,
                    })
                  }
                >
                  Disable Plugin
                </Dropdown.Item>
              </Dropdown.Group>
            </Dropdown.Content>
          </Dropdown>
        )}
      </div>
      <Container
        definition={pluginDefinition}
        metadata={metadata}
        onSave={onSave}
      />
    </div>
  );
}
