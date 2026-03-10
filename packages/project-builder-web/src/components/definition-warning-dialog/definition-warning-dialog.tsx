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
          The following warnings were found in your project definition. Please
          fix them before syncing.
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
              // Use entityId directly when available, fall back to prefix matching
              let closestEntity: DefinitionEntity | undefined;
              if (warning.entityId) {
                closestEntity = definitionContainer.entityFromId(
                  warning.entityId,
                );
              } else {
                for (const entity of entities) {
                  const ep = entity.path;
                  const wp = warning.path;
                  if (
                    ep.length <= wp.length &&
                    ep.every((seg, i) => String(seg) === String(wp[i])) &&
                    (!closestEntity || closestEntity.path.length < ep.length)
                  ) {
                    closestEntity = entity;
                  }
                }
              }

              const pathInEntity = warning.path.join('.');

              const navOptions = closestEntity
                ? getEntityNavOptions(
                    definitionContainer,
                    closestEntity,
                    pluginContainer,
                  )
                : undefined;

              return (
                <TableRow key={`${pathInEntity}-${index}`}>
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
            onClick={() => {
              setDialogOptions(undefined);
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
