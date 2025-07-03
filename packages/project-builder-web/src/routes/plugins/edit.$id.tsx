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
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { HiDotsVertical } from 'react-icons/hi';

import { NotFoundCard } from '#src/components/index.js';
import { logAndFormatError } from '#src/services/error-formatter.js';

import { loadPluginImplementationStoreWithNewPlugin } from './-components/utils.js';

export const Route = createFileRoute('/plugins/edit/$id')({
  component: PluginConfigPage,
  beforeLoad: () => ({
    getTitle: () => 'Plugin Configuration',
  }),
});

function PluginConfigPage(): React.JSX.Element {
  const {
    definitionContainer,
    pluginContainer,
    schemaParserContext,
    saveDefinitionWithFeedbackSync,
    isSavingDefinition,
  } = useProjectDefinition();
  const { id } = Route.useParams();
  const { requestConfirm } = useConfirmDialog();
  const navigate = useNavigate({ from: Route.fullPath });

  const pluginDefinition = PluginUtils.byId(definitionContainer.definition, id);

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
    return <NotFoundCard />;
  }

  const { metadata } = plugin;

  function onDisablePlugin(): void {
    saveDefinitionWithFeedbackSync(
      (draft) => {
        draft.plugins = (draft.plugins ?? []).filter(
          (p) => p.id !== pluginEntityType.idFromKey(metadata.id),
        );
      },
      {
        successMessage: `Disabled ${metadata.displayName}!`,
        onSuccess: () => {
          navigate({ to: '/plugins' }).catch(logAndFormatError);
        },
      },
    );
  }

  function onSave(): void {
    if (!pluginDefinition) {
      navigate({ to: '/plugins' }).catch(logAndFormatError);
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
