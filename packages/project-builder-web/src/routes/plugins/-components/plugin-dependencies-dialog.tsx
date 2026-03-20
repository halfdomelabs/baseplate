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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plugin</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dependencies.map((dep, index) => (
              <TableRow key={dep.metadata.key}>
                <TableCell className="max-w-md wrap-break-word">
                  <div>
                    <strong>{dep.metadata.displayName}</strong>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {dep.metadata.description}
                  </div>
                </TableCell>
                <TableCell className="w-28 text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
