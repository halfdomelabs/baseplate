import type { ModelConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  FeatureUtils,
  modelEntityType,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { Button, useConfirmDialog } from '@baseplate-dev/ui-components';
import { useNavigate } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';

import { logAndFormatError } from '#src/services/error-formatter.js';

import { ModelInfoEditDialog } from './model-info-edit-dialog.js';

interface ModelHeaderBarProps {
  className?: string;
  model: ModelConfig;
}

export function ModelHeaderBar({
  className,
  model,
}: ModelHeaderBarProps): React.JSX.Element {
  const { definition, saveDefinitionWithFeedbackSync, isSavingDefinition } =
    useProjectDefinition();
  const currentModel = ModelUtils.byId(definition, model.id) ?? model;
  const navigate = useNavigate();
  const { requestConfirm } = useConfirmDialog();

  const handleDelete = (id: string): void => {
    saveDefinitionWithFeedbackSync(
      (draftConfig) => {
        draftConfig.models = draftConfig.models.filter((m) => m.id !== id);
      },
      {
        onSuccess: () => {
          navigate({ to: '/data/models' }).catch(logAndFormatError);
        },
        successMessage: 'Successfully deleted model!',
      },
    );
  };

  return (
    <div
      className={clsx(
        'flex items-center justify-between border-b py-4',
        className,
      )}
    >
      <div>
        <div className="group flex items-center space-x-2">
          <h1>{currentModel.name}</h1>
          <ModelInfoEditDialog
            modelKey={modelEntityType.keyFromId(model.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label="Edit model info"
                className="invisible group-hover:visible"
              >
                <MdEdit className="size-4" />
              </Button>
            }
          />
        </div>
        {currentModel.featureRef && (
          <div className="text-xs text-muted-foreground">
            {
              FeatureUtils.getFeatureById(definition, currentModel.featureRef)
                ?.name
            }
          </div>
        )}
      </div>
      <div className="flex gap-8">
        <Button
          variant="outline"
          size="icon"
          disabled={isSavingDefinition}
          onClick={() => {
            requestConfirm({
              title: 'Confirm delete',
              content: `Are you sure you want to delete ${model.name}?`,
              buttonConfirmText: 'Delete',
              buttonConfirmVariant: 'destructive',
              onConfirm: () => {
                handleDelete(model.id);
              },
            });
          }}
        >
          <MdDeleteOutline className="text-destructive" />
          <div className="sr-only">Delete Model</div>
        </Button>
      </div>
    </div>
  );
}
