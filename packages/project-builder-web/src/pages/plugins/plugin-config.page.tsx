import type React from 'react';

import {
  pluginEntityType,
  PluginUtils,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { useMemo } from 'react';
import { HiDotsVertical } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';

import NotFoundPage from '../NotFound.page.js';
import { loadPluginImplementationStoreWithNewPlugin } from './utils.js';

export function PluginConfigPage(): React.JSX.Element {
  const {
    definitionContainer,
    pluginContainer,
    schemaParserContext,
    saveDefinitionWithFeedbackSync,
    isSavingDefinition,
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
    saveDefinitionWithFeedbackSync(
      (draft) => {
        draft.plugins = (draft.plugins ?? []).filter(
          (p) => p.id !== pluginEntityType.fromUid(metadata.id),
        );
      },
      {
        successMessage: `Disabled ${metadata.displayName}!`,
        onSuccess: () => {
          navigate('/plugins');
        },
      },
    );
  }

  function onSave(): void {
    if (!pluginDefinition) {
      navigate('/plugins');
    }
  }

  return (
    <div className="relative flex h-full flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center justify-between">
          <h1>{metadata.displayName} Plugin</h1>
          {pluginDefinition && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HiDotsVertical aria-label="More Actions" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={isSavingDefinition}
                    onSelect={() => {
                      requestConfirm({
                        title: 'Disable Plugin',
                        content: `Are you sure you want to disable the ${metadata.displayName} plugin?`,
                        onConfirm: onDisablePlugin,
                      });
                    }}
                  >
                    Disable Plugin
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <Container
          definition={pluginDefinition}
          metadata={metadata}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
