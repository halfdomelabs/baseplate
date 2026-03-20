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
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from '@tanstack/react-router';
import { useMemo } from 'react';
import { HiDotsVertical } from 'react-icons/hi';
import { MdWarning } from 'react-icons/md';

import { NotFoundCard } from '#src/components/index.js';
import { logAndFormatError } from '#src/services/error-formatter.js';

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
  const unmetDeps = useMemo(() => {
    if (pluginDefinition) return [];
    const { pluginStore } = schemaParserContext;
    const enabledPlugins = definitionContainer.definition.plugins ?? [];
    const enabledFqns = buildEnabledPluginFqnSet(pluginStore, enabledPlugins);
    return getUnmetPluginDependencies(pluginStore, key, enabledFqns);
  }, [pluginDefinition, schemaParserContext, definitionContainer, key]);

  if (!Container) {
    return <NotFoundCard />;
  }

  if (unmetDeps.length > 0) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto p-4">
        <h1>{pluginMetadata.displayName} Plugin</h1>
        <Alert variant="warning">
          <MdWarning />
          <AlertTitle>Missing Required Dependencies</AlertTitle>
          <AlertDescription>
            <p>
              {pluginMetadata.displayName} requires the following plugins to be
              enabled and configured first:
            </p>
            <ul className="list-inside list-disc">
              {unmetDeps.map((dep) => (
                <li key={dep.key}>
                  <Link
                    to="/plugins/edit/$key"
                    params={{ key: dep.key }}
                    className="underline"
                  >
                    {dep.displayName}
                  </Link>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => {
                navigate({ to: '/plugins' }).catch(logAndFormatError);
              }}
            >
              Back to Plugins
            </Button>
          </AlertDescription>
        </Alert>
      </div>
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
