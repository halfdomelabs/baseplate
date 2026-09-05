import type { EnumConfigInput } from '@baseplate-dev/project-builder-lib';
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
  enumDefinition: EnumConfigInput;
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
        draftConfig.enums = draftConfig.enums.filter((m) => m.id !== id);
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
        <div className="group flex items-center space-x-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {enumDefinition.name}
          </h1>
          <EnumInfoEditDialog
            enumKey={modelEnumEntityType.keyFromId(enumDefinition.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label="Edit enum info"
                className="invisible group-hover:visible"
              >
                <MdEdit className="size-4" />
              </Button>
            }
          />
        </div>
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
