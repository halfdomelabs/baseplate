import {
  PluginMetadataWithPaths,
  webConfigSpec,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Button, Card } from '@halfdomelabs/ui-components';
import { MdExtension } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';

import { loadPluginImplementationStoreWithNewPlugin } from './utils';
import { useProjects } from '@src/hooks/useProjects';
import { useToast } from '@src/hooks/useToast';
import { getPluginStaticUrl } from '@src/services/plugins';

interface PluginCardProps {
  className?: string;
  plugin: PluginMetadataWithPaths;
  isActive: boolean;
}

export function PluginCard({
  className,
  plugin,
  isActive,
}: PluginCardProps): JSX.Element {
  const { currentProjectId } = useProjects();
  const {
    setConfigAndFixReferences,
    schemaParserContext,
    definitionContainer,
    pluginContainer,
  } = useProjectDefinition();
  const toast = useToast();
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
      navigate(`/plugins/edit/${plugin.id}`);
      return;
    }
    setConfigAndFixReferences((draft) => {
      draft.plugins = [
        ...(draft.plugins ?? []).filter(
          (p) => p.packageName !== plugin.packageName || p.name !== plugin.name,
        ),
        {
          id: plugin.id,
          packageName: plugin.packageName,
          name: plugin.name,
          version: plugin.version,
          config: {},
        },
      ];
    });
    toast.success(`Enabled ${plugin.displayName}!`);
  }

  function disablePlugin(): void {
    setConfigAndFixReferences((draft) => {
      draft.plugins = (draft.plugins ?? []).filter(
        (p) => p.packageName !== plugin.packageName || p.name !== plugin.name,
      );
    });
    toast.success(`Disabled ${plugin.displayName}!`);
  }

  const webConfigImplementation = pluginContainer.getPluginSpec(webConfigSpec);
  const webConfig = webConfigImplementation.getWebConfigComponent(plugin.id);

  return (
    <Card className={className}>
      <Card.Header>
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
              <Card.Title>{plugin.displayName}</Card.Title>
              <Card.Description>{plugin.packageName}</Card.Description>
            </div>
          </div>
          <div>
            {(() => {
              if (!isActive) {
                return (
                  <Button variant="secondary" onClick={enablePlugin}>
                    Enable
                  </Button>
                );
              } else if (webConfig) {
                return (
                  <Link to={`/plugins/edit/${plugin.id}`}>
                    <Button variant="secondary">Configure</Button>
                  </Link>
                );
              } else {
                return (
                  <Button variant="secondary" onClick={disablePlugin}>
                    Disable
                  </Button>
                );
              }
            })()}
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="text-sm">
          <p>{plugin.description}</p>
        </div>
      </Card.Content>
    </Card>
  );
}
