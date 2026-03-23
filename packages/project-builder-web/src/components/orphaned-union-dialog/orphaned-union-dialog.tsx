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

import { useOrphanedUnionDialogState } from '#src/hooks/use-orphaned-union-dialog.js';
import { usePrevious } from '#src/hooks/use-previous.js';
import { getEntityNavOptions } from '#src/services/entity-type.js';

export function OrphanedUnionDialog(): React.JSX.Element {
  const { dialogOptions, setDialogOptions } = useOrphanedUnionDialogState();
  const { definitionContainer, pluginContainer } = useProjectDefinition();
  const { entities } = definitionContainer;

  // Cache options during close animation (same pattern as RefIssueDialog)
  const dialogOptionsCached = usePrevious(dialogOptions);

  const { items } = dialogOptions ?? dialogOptionsCached ?? {};

  return (
    <Dialog
      open={!!dialogOptions}
      onOpenChange={() => {
        setDialogOptions(undefined);
      }}
    >
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>Unable to disable plugin</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          The following items use types provided by this plugin. Remove them
          before disabling the plugin.
        </DialogDescription>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map((item) => {
              // Find the entity whose path best matches the orphaned item's
              // path. This uses the current (pre-disable) definition where the
              // orphaned entity still exists.
              const itemPath = item.path.join('.');
              let matchedEntity: DefinitionEntity | undefined;
              for (const e of entities) {
                const entityPath = e.path.join('.');
                if (
                  itemPath.startsWith(entityPath) &&
                  (!matchedEntity ||
                    entityPath.length > matchedEntity.path.join('.').length)
                ) {
                  matchedEntity = e;
                }
              }
              const navOptions = matchedEntity
                ? getEntityNavOptions(
                    definitionContainer,
                    matchedEntity,
                    pluginContainer,
                  )
                : undefined;
              return (
                <TableRow key={itemPath}>
                  <TableCell>
                    {matchedEntity ? (
                      <div className="text-style-prose">
                        <div>
                          {navOptions ? (
                            <Link
                              {...navOptions}
                              onClick={() => {
                                setDialogOptions(undefined);
                              }}
                            >
                              <strong>{matchedEntity.name}</strong>
                            </Link>
                          ) : (
                            <strong>{matchedEntity.name}</strong>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {matchedEntity.type.name}
                        </div>
                      </div>
                    ) : (
                      <strong>Root</strong>
                    )}
                  </TableCell>
                  <TableCell>
                    <code>{item.discriminatorValue}</code>
                  </TableCell>
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
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
