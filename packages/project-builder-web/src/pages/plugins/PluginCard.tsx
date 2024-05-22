import { PluginConfigWithModule } from '@halfdomelabs/project-builder-lib';
import { Button, Card } from '@halfdomelabs/ui-components';
import { MdExtension } from 'react-icons/md';

import { useProjects } from '@src/hooks/useProjects';
import { getPluginStaticUrl } from '@src/services/plugins';

interface PluginCardProps {
  className?: string;
  plugin: PluginConfigWithModule;
}

export function PluginCard({
  className,
  plugin,
}: PluginCardProps): JSX.Element {
  const { currentProjectId } = useProjects();
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
            <Button variant="secondary">Manage</Button>
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
