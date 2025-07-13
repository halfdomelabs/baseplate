import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  pluginEntityType,
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
} from '@baseplate-dev/ui-components';
import { Link, useNavigate } from '@tanstack/react-router';
import { MdExtension } from 'react-icons/md';

import { useProjects } from '#src/hooks/use-projects.js';
import { logAndFormatError } from '#src/services/error-formatter.js';
import { getPluginStaticUrl } from '#src/services/plugins.js';

import { loadPluginImplementationStoreWithNewPlugin } from './utils.js';

interface PluginCardProps {
  className?: string;
  plugin: PluginMetadataWithPaths;
  isActive: boolean;
}

export function PluginCard({
  className,
  plugin,
  isActive,
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

  function enablePlugin(): void {
    const implementations = loadPluginImplementationStoreWithNewPlugin(
      schemaParserContext.pluginStore,
      plugin,
      definitionContainer.definition,
    );
    const webConfigImplementation =
      implementations.getPluginSpec(webConfigSpec);
    const webConfig = webConfigImplementation.getWebConfigComponent(plugin.id);
    if (webConfig) {
      // redirect to plugin config page
      navigate({ to: `/plugins/edit/${plugin.id}` }).catch(logAndFormatError);
      return;
    }
    saveDefinitionWithFeedbackSync(
      (draft) => {
        // Remove any existing instance of this plugin
        draft.plugins = (draft.plugins ?? []).filter(
          (p) => p.packageName !== plugin.packageName || p.name !== plugin.name,
        );

        // Add the plugin with proper schema version
        PluginUtils.setPluginConfig(draft, plugin, {}, implementations);
      },
      {
        successMessage: `Enabled ${plugin.displayName}!`,
      },
    );
  }

  function disablePlugin(): void {
    saveDefinitionWithFeedbackSync(
      (draft) => {
        draft.plugins = (draft.plugins ?? []).filter(
          (p) => p.id !== pluginEntityType.idFromKey(plugin.id),
        );
      },
      {
        successMessage: `Disabled ${plugin.displayName}!`,
      },
    );
  }

  const webConfigImplementation = pluginContainer.getPluginSpec(webConfigSpec);
  const webConfig = webConfigImplementation.getWebConfigComponent(plugin.id);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="rounded-xl border">
              {plugin.icon && currentProjectId ? (
                <img
                  src={getPluginStaticUrl(
                    currentProjectId,
                    plugin.id,
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
                    to={`/plugins/edit/$id`}
                    from="/"
                    params={{ id: plugin.id }}
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
  );
}
