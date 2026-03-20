import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  buildEnabledPluginFqnSet,
  createPluginImplementationStoreWithNewPlugins,
  getUnmetPluginDependencies,
  PluginUtils,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { MdExtension } from 'react-icons/md';

import { useProjects } from '#src/hooks/use-projects.js';
import { logAndFormatError } from '#src/services/error-formatter.js';
import { getPluginStaticUrl } from '#src/services/plugins.js';

import type { UnmetPluginDependency } from './unmet-dependency-list.js';

import { PluginDependenciesDialog } from './plugin-dependencies-dialog.js';

interface PluginCardProps {
  className?: string;
  plugin: PluginMetadataWithPaths;
  isActive: boolean;
  managerPlugin?: PluginMetadataWithPaths;
}

export function PluginCard({
  className,
  plugin,
  isActive,
  managerPlugin,
}: PluginCardProps): React.JSX.Element {
  const { currentProjectId } = useProjects();
  const {
    saveDefinitionWithFeedbackSync,
    schemaParserContext,
    definitionContainer,
    pluginContainer,
    isSavingDefinition,
  } = useProjectDefinition();
  const navigate = useNavigate();
  const { requestConfirm } = useConfirmDialog();
  const [depsDialogOpen, setDepsDialogOpen] = useState(false);
  const [unmetDeps, setUnmetDeps] = useState<UnmetPluginDependency[]>([]);

  /**
   * Checks if a plugin has a web config component (requires user configuration).
   */
  function pluginHasWebConfig(
    pluginMetadata: PluginMetadataWithPaths,
  ): boolean {
    const implementations = createPluginImplementationStoreWithNewPlugins(
      schemaParserContext.pluginStore,
      [pluginMetadata],
      definitionContainer.definition,
    );
    return implementations
      .use(webConfigSpec)
      .components.has(pluginMetadata.key);
  }

  function enablePlugin(): void {
    const { pluginStore } = schemaParserContext;
    const enabledPlugins = definitionContainer.definition.plugins ?? [];
    const enabledFqns = buildEnabledPluginFqnSet(pluginStore, enabledPlugins);

    const deps = getUnmetPluginDependencies(
      pluginStore,
      plugin.key,
      enabledFqns,
    );

    if (deps.length > 0) {
      setUnmetDeps(
        deps.map((dep) => ({
          metadata: dep,
          hasWebConfig: pluginHasWebConfig(dep),
        })),
      );
      setDepsDialogOpen(true);
      return;
    }

    // No unmet deps — proceed with enable
    if (pluginHasWebConfig(plugin)) {
      navigate({ to: `/plugins/edit/${plugin.key}` }).catch(logAndFormatError);
      return;
    }

    saveDefinitionWithFeedbackSync(
      (draft) => {
        draft.plugins = (draft.plugins ?? []).filter(
          (p) => p.packageName !== plugin.packageName || p.name !== plugin.name,
        );
        PluginUtils.setPluginConfig(draft, plugin, {}, definitionContainer);
      },
      {
        successMessage: `Enabled ${plugin.displayName}!`,
      },
    );
  }

  function disablePlugin(): void {
    const { pluginStore } = schemaParserContext;
    const dependents = PluginUtils.getDependentPlugins(
      definitionContainer.definition,
      plugin.key,
      pluginStore,
    );

    if (dependents.length > 0) {
      const depNames = dependents.map((d) => d.displayName).join(', ');
      requestConfirm({
        title: 'Disable Plugin',
        content: `Disabling ${plugin.displayName} will also disable ${depNames} which ${dependents.length === 1 ? 'depends' : 'depend'} on it. Continue?`,
        buttonConfirmText: 'Disable All',
        buttonConfirmVariant: 'destructive',
        buttonCancelText: 'Cancel',
        onConfirm: () => {
          saveDefinitionWithFeedbackSync(
            (draft) => {
              for (const dep of dependents) {
                PluginUtils.disablePlugin(draft, dep.key, schemaParserContext);
              }
              PluginUtils.disablePlugin(draft, plugin.key, schemaParserContext);
            },
            {
              successMessage: `Disabled ${plugin.displayName} and ${depNames}!`,
            },
          );
        },
      });
      return;
    }

    saveDefinitionWithFeedbackSync(
      (draft) => {
        PluginUtils.disablePlugin(draft, plugin.key, schemaParserContext);
      },
      {
        successMessage: `Disabled ${plugin.displayName}!`,
      },
    );
  }

  const webConfigImplementation = pluginContainer.use(webConfigSpec);
  const webConfig = webConfigImplementation.components.get(plugin.key);

  // For managed plugins, check if the manager plugin has a web config
  const managerWebConfig = managerPlugin
    ? webConfigImplementation.components.get(managerPlugin.key)
    : null;

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-xl border">
                {plugin.icon && currentProjectId ? (
                  <img
                    src={getPluginStaticUrl(
                      currentProjectId,
                      plugin.key,
                      plugin.icon,
                    )}
                    className="size-12 rounded-xl bg-muted"
                    alt={`${plugin.displayName} logo`}
                  />
                ) : (
                  <MdExtension className="size-12 bg-muted p-2" />
                )}
              </div>
              <div>
                <CardTitle>{plugin.displayName}</CardTitle>
                <CardDescription>{plugin.packageName}</CardDescription>
              </div>
            </div>
            <div>
              {(() => {
                // Managed plugins cannot be enabled/disabled directly
                if (managerPlugin) {
                  return managerWebConfig && isActive ? (
                    <Link
                      to={`/plugins/edit/$key`}
                      params={{ key: managerPlugin.key }}
                    >
                      <Button variant="secondary">Configure</Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" disabled>
                      {isActive ? 'Managed' : 'Disabled'}
                    </Button>
                  );
                }

                // Regular plugin logic
                if (!isActive) {
                  return (
                    <Button
                      variant="secondary"
                      onClick={enablePlugin}
                      disabled={isSavingDefinition}
                    >
                      Enable
                    </Button>
                  );
                } else if (webConfig) {
                  return (
                    <Link
                      to={`/plugins/edit/$key`}
                      params={{ key: plugin.key }}
                    >
                      <Button variant="secondary">Configure</Button>
                    </Link>
                  );
                } else {
                  return (
                    <Button
                      variant="secondary"
                      onClick={disablePlugin}
                      disabled={isSavingDefinition}
                    >
                      Disable
                    </Button>
                  );
                }
              })()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p>{plugin.description}</p>
          </div>
        </CardContent>
      </Card>
      <PluginDependenciesDialog
        open={depsDialogOpen}
        onOpenChange={setDepsDialogOpen}
        pluginDisplayName={plugin.displayName}
        dependencies={unmetDeps}
      />
    </>
  );
}
