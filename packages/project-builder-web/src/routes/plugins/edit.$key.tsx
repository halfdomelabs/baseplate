import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  buildEnabledPluginFqnSet,
  createPluginImplementationStoreWithNewPlugins,
  getPluginMetadataByKey,
  getUnmetPluginDependencies,
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { HiDotsVertical } from 'react-icons/hi';

import { NotFoundCard } from '#src/components/index.js';
import { logAndFormatError } from '#src/services/error-formatter.js';

interface UnmetDep {
  metadata: PluginMetadataWithPaths;
  hasWebConfig: boolean;
}

export const Route = createFileRoute('/plugins/edit/$key')({
  component: PluginConfigPage,
  beforeLoad: ({ params: { key }, context: { schemaParserContext } }) => {
    const pluginMetadata = getPluginMetadataByKey(
      schemaParserContext.pluginStore,
      key,
    );
    if (!pluginMetadata) return {};
    return {
      getTitle: () => pluginMetadata.displayName,
      pluginMetadata,
    };
  },
  loader: ({ context: { pluginMetadata } }) => {
    if (!pluginMetadata) throw notFound();
    return { pluginMetadata };
  },
});

function PluginConfigPage(): React.JSX.Element {
  const {
    definitionContainer,
    pluginContainer,
    schemaParserContext,
    saveDefinitionWithFeedbackSync,
    isSavingDefinition,
  } = useProjectDefinition();
  const { key } = Route.useParams();
  const { requestConfirm } = useConfirmDialog();
  const navigate = useNavigate({ from: Route.fullPath });
  const { pluginMetadata } = Route.useLoaderData();

  const pluginDefinition = PluginUtils.byKey(
    definitionContainer.definition,
    key,
  );

  const Container = useMemo(() => {
    if (!key) {
      return;
    }

    const pluginSpec = pluginContainer.use(webConfigSpec);
    const webConfigComponent = pluginSpec.components.get(key);
    if (webConfigComponent) {
      return webConfigComponent;
    }
    const newPluginContainer = createPluginImplementationStoreWithNewPlugins(
      schemaParserContext.pluginStore,
      [pluginMetadata],
      definitionContainer.definition,
    );

    return newPluginContainer.use(webConfigSpec).components.get(key);
  }, [
    key,
    schemaParserContext,
    definitionContainer,
    pluginContainer,
    pluginMetadata,
  ]);

  // Check for unmet dependencies when plugin is not yet enabled
  const unmetDeps = useMemo((): UnmetDep[] => {
    if (pluginDefinition) return [];
    const { pluginStore } = schemaParserContext;
    const enabledPlugins = definitionContainer.definition.plugins ?? [];
    const enabledFqns = buildEnabledPluginFqnSet(pluginStore, enabledPlugins);
    const deps = getUnmetPluginDependencies(pluginStore, key, enabledFqns);
    return deps.map((dep) => {
      const implementations = createPluginImplementationStoreWithNewPlugins(
        pluginStore,
        [dep],
        definitionContainer.definition,
      );
      return {
        metadata: dep,
        hasWebConfig: implementations
          .use(webConfigSpec)
          .components.has(dep.key),
      };
    });
  }, [pluginDefinition, schemaParserContext, definitionContainer, key]);

  if (!Container) {
    return <NotFoundCard />;
  }

  if (unmetDeps.length > 0) {
    return (
      <UnmetDependenciesView
        pluginMetadata={pluginMetadata}
        unmetDeps={unmetDeps}
      />
    );
  }

  function onDisablePlugin(): void {
    saveDefinitionWithFeedbackSync(
      (draft) => {
        PluginUtils.disablePlugin(
          draft,
          pluginMetadata.key,
          schemaParserContext,
        );
      },
      {
        successMessage: `Disabled ${pluginMetadata.displayName}!`,
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
          <h1>{pluginMetadata.displayName} Plugin</h1>
          {pluginDefinition && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" />}
              >
                <HiDotsVertical aria-label="More Actions" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={isSavingDefinition}
                    onClick={() => {
                      requestConfirm({
                        title: 'Disable Plugin',
                        content: `Are you sure you want to disable the ${pluginMetadata.displayName} plugin?`,
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
          metadata={pluginMetadata}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

function UnmetDependenciesView({
  pluginMetadata,
  unmetDeps,
}: {
  pluginMetadata: PluginMetadataWithPaths;
  unmetDeps: UnmetDep[];
}): React.ReactElement {
  const {
    saveDefinitionWithFeedbackSync,
    definitionContainer,
    isSavingDefinition,
  } = useProjectDefinition();
  const navigate = useNavigate({ from: Route.fullPath });
  const [enablingKey, setEnablingKey] = useState<string | null>(null);

  function handleEnable(dep: UnmetDep): void {
    setEnablingKey(dep.metadata.key);
    saveDefinitionWithFeedbackSync(
      (draft) => {
        PluginUtils.setPluginConfig(
          draft,
          dep.metadata,
          {},
          definitionContainer,
        );
      },
      {
        successMessage: `Enabled ${dep.metadata.displayName}!`,
        onSuccess: () => {
          setEnablingKey(null);
        },
      },
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto p-4">
      <h1>{pluginMetadata.displayName} Plugin</h1>
      <div className="flex max-w-lg flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {pluginMetadata.displayName} requires the following plugins to be
          enabled and configured first:
        </p>
        <ItemGroup>
          {unmetDeps.map((dep) => (
            <Item key={dep.metadata.key} variant="outline">
              <ItemContent>
                <ItemTitle>{dep.metadata.displayName}</ItemTitle>
                <ItemDescription>{dep.metadata.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                {dep.hasWebConfig ? (
                  <Link
                    to="/plugins/edit/$key"
                    params={{ key: dep.metadata.key }}
                  >
                    <Button variant="secondary" size="sm">
                      Configure
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSavingDefinition || enablingKey !== null}
                    onClick={() => {
                      handleEnable(dep);
                    }}
                  >
                    {enablingKey === dep.metadata.key
                      ? 'Enabling...'
                      : 'Enable'}
                  </Button>
                )}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              navigate({ to: '/plugins' }).catch(logAndFormatError);
            }}
          >
            Back to Plugins
          </Button>
        </div>
      </div>
    </div>
  );
}
