import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { PluginUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

export interface UnmetPluginDependency {
  metadata: PluginMetadataWithPaths;
  hasWebConfig: boolean;
}

interface PluginDependenciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pluginDisplayName: string;
  dependencies: UnmetPluginDependency[];
}

export function PluginDependenciesDialog({
  open,
  onOpenChange,
  pluginDisplayName,
  dependencies,
}: PluginDependenciesDialogProps): React.JSX.Element {
  const {
    saveDefinitionWithFeedbackSync,
    definitionContainer,
    isSavingDefinition,
  } = useProjectDefinition();
  const [enablingIndex, setEnablingIndex] = useState<number | null>(null);

  function handleEnable(dep: UnmetPluginDependency, index: number): void {
    setEnablingIndex(index);
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
          setEnablingIndex(null);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>Required Dependencies</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {pluginDisplayName} requires the following plugins to be enabled
          first.
        </DialogDescription>
        <ItemGroup>
          {dependencies.map((dep, index) => (
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
                    onClick={() => {
                      onOpenChange(false);
                    }}
                  >
                    <Button variant="secondary" size="sm">
                      Configure
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSavingDefinition || enablingIndex !== null}
                    onClick={() => {
                      handleEnable(dep, index);
                    }}
                  >
                    {enablingIndex === index ? 'Enabling...' : 'Enable'}
                  </Button>
                )}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
