import type { DefinitionEntity } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

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

import { useDefinitionWarningDialogState } from '#src/hooks/use-definition-warning-dialog.js';
import { usePrevious } from '#src/hooks/use-previous.js';
import { getEntityNavOptions } from '#src/services/entity-type.js';

export function DefinitionWarningDialog(): React.JSX.Element {
  const { dialogOptions, setDialogOptions } = useDefinitionWarningDialogState();
  const { definitionContainer, pluginContainer } = useProjectDefinition();
  const { entities } = definitionContainer;

  // Cache options during close transition
  const dialogOptionsCached = usePrevious(dialogOptions);

  const options = dialogOptions ?? dialogOptionsCached;
  const warnings = options?.warnings;

  return (
    <Dialog
      open={!!dialogOptions}
      onOpenChange={() => {
        setDialogOptions(undefined);
      }}
    >
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>Definition warnings</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          The following warnings were found in your project definition. You can
          fix them now or proceed with syncing.
        </DialogDescription>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warnings?.map((warning, index) => {
              const issuePath = warning.path.join('.');

              // Find the closest entity for this path
              let closestEntity: DefinitionEntity | undefined;
              for (const entity of entities) {
                const entityPath = entity.path.join('.');
                if (
                  issuePath.startsWith(entityPath) &&
                  (!closestEntity ||
                    closestEntity.path.length < entity.path.length)
                ) {
                  closestEntity = entity;
                }
              }

              const pathInEntity = closestEntity
                ? issuePath.slice(
                    Math.max(0, closestEntity.path.join('.').length + 1),
                  )
                : issuePath;

              const navOptions = closestEntity
                ? getEntityNavOptions(
                    definitionContainer,
                    closestEntity,
                    pluginContainer,
                  )
                : undefined;

              return (
                <TableRow key={`${issuePath}-${index}`}>
                  <TableCell>
                    {closestEntity ? (
                      <div className="text-style-prose">
                        <div>
                          {navOptions ? (
                            <Link
                              {...navOptions}
                              onClick={() => {
                                setDialogOptions(undefined);
                              }}
                            >
                              <strong>{closestEntity.name}</strong>
                            </Link>
                          ) : (
                            <strong>{closestEntity.name}</strong>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {closestEntity.type.name}
                        </div>
                      </div>
                    ) : (
                      <strong>Root</strong>
                    )}
                  </TableCell>
                  <TableCell>{pathInEntity}</TableCell>
                  <TableCell>{warning.message}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <DialogFooter>
          <Button
            variant={options?.onProceed ? 'outline' : 'default'}
            onClick={() => {
              setDialogOptions(undefined);
            }}
          >
            {options?.onProceed ? 'Fix Issues' : 'Close'}
          </Button>
          {options?.onProceed && (
            <Button
              onClick={() => {
                options.onProceed?.();
                setDialogOptions(undefined);
              }}
            >
              Sync Anyway
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
