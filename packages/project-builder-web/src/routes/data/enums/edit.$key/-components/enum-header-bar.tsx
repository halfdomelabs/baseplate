import type { EnumConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  FeatureUtils,
  modelEnumEntityType,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { Button, useConfirmDialog } from '@baseplate-dev/ui-components';
import { useNavigate } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';

import { logAndFormatError } from '#src/services/error-formatter.js';

import { EnumInfoEditDialog } from './enum-info-edit-dialog.js';

interface EnumHeaderBarProps {
  className?: string;
  enumDefinition: EnumConfig;
}

export function EnumHeaderBar({
  className,
  enumDefinition,
}: EnumHeaderBarProps): React.JSX.Element {
  const { definition, saveDefinitionWithFeedbackSync, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();
  const { requestConfirm } = useConfirmDialog();

  const handleDelete = (id: string): void => {
    saveDefinitionWithFeedbackSync(
      (draftConfig) => {
        draftConfig.enums = draftConfig.enums?.filter((m) => m.id !== id);
      },
      {
        onSuccess: () => {
          navigate({ to: '/data/enums' }).catch(logAndFormatError);
        },
      },
    );
  };

  return (
    <div className={clsx('flex items-center justify-between', className)}>
      <div>
        <EnumInfoEditDialog
          enumKey={modelEnumEntityType.keyFromId(enumDefinition.id)}
          asChild
        >
          <button
            className="group flex items-center space-x-2 hover:cursor-pointer"
            type="button"
            title="Edit Enum Info"
          >
            <h1>{enumDefinition.name}</h1>
            <MdEdit className="invisible size-4 group-hover:visible" />
          </button>
        </EnumInfoEditDialog>
        {enumDefinition.featureRef && (
          <div className="text-xs text-muted-foreground">
            {
              FeatureUtils.getFeatureById(definition, enumDefinition.featureRef)
                ?.name
            }
          </div>
        )}
      </div>
      <div className="flex gap-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            requestConfirm({
              title: 'Confirm delete',
              content: `Are you sure you want to delete ${
                enumDefinition.name
              }?`,
              buttonConfirmVariant: 'destructive',
              buttonConfirmText: 'Delete',
              onConfirm: () => {
                handleDelete(enumDefinition.id);
              },
            });
          }}
          disabled={isSavingDefinition}
        >
          <MdDeleteOutline className="text-destructive" />
          <div className="sr-only">Delete Enum</div>
        </Button>
      </div>
    </div>
  );
}
