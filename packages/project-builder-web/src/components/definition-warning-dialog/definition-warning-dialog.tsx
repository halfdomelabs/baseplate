import type {
  DefinitionEntity,
  DefinitionIssue,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { createIssueFixSetter } from '@baseplate-dev/project-builder-lib';
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
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { MdInfo } from 'react-icons/md';

import { useDefinitionWarningDialogState } from '#src/hooks/use-definition-warning-dialog.js';
import { usePrevious } from '#src/hooks/use-previous.js';
import { getEntityNavOptions } from '#src/services/entity-type.js';
import { logAndFormatError } from '#src/services/error-formatter.js';

export function DefinitionWarningDialog(): React.JSX.Element {
  const { dialogOptions, setDialogOptions } = useDefinitionWarningDialogState();
  const { definitionContainer, pluginContainer, saveDefinition } =
    useProjectDefinition();
  const { entities } = definitionContainer;
  const [applyingFixIndex, setApplyingFixIndex] = useState<number | null>(null);

  // Cache options during close transition
  const dialogOptionsCached = usePrevious(dialogOptions);

  const options = dialogOptions ?? dialogOptionsCached;
  const warnings = options?.warnings;

  function handleApplyFix(warning: DefinitionIssue, index: number): void {
    const setter = createIssueFixSetter(warning, definitionContainer);
    if (!setter) return;

    const fixLabel = warning.fix?.label ?? 'fix';

    setApplyingFixIndex(index);
    saveDefinition(setter)
      .then(({ warnings: newWarnings }) => {
        if (newWarnings.length > 0) {
          setDialogOptions({ warnings: newWarnings });
        } else {
          setDialogOptions(undefined);
          toast.success(`Applied fix: ${fixLabel}`);
        }
      })
      .catch((err: unknown) => {
        toast.error(logAndFormatError(err, `Failed to apply fix: ${fixLabel}`));
      })
      .finally(() => {
        setApplyingFixIndex(null);
      });
  }

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
              <TableHead />
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
                  <TableCell>
                    {warning.fix ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={applyingFixIndex !== null}
                          onClick={() => {
                            handleApplyFix(warning, index);
                          }}
                        >
                          {applyingFixIndex === index
                            ? 'Applying...'
                            : 'Apply fix'}
                        </Button>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Fix details"
                              className="size-7 opacity-50"
                            >
                              <MdInfo />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[300px]">
                            {warning.fix.label}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : null}
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
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
