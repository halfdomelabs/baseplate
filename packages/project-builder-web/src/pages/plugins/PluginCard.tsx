import {
  PluginMetadata,
  PluginMetadataWithPaths,
  pluginEntityType,
} from '@halfdomelabs/project-builder-lib';
import { Button, Card } from '@halfdomelabs/ui-components';
import { MdExtension } from 'react-icons/md';

import { useProjectDefinition } from '@src/hooks/useProjectDefinition';
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
  const { setConfigAndFixReferences } = useProjectDefinition();
  const toast = useToast();

  function enablePlugin(): void {
    setConfigAndFixReferences((draft) => {
      draft.plugins = [
        ...(draft.plugins ?? []).filter(
          (p) => p.packageName !== plugin.packageName || p.name !== plugin.name,
        ),
        {
          id: pluginEntityType.generateNewId(),
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
            {isActive ? (
              <Button variant="secondary" onClick={disablePlugin}>
                Disable
              </Button>
            ) : (
              <Button variant="secondary" onClick={enablePlugin}>
                Enable
              </Button>
            )}
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
