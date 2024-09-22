import { FeatureUtils, ModelConfig } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Button, toast, useConfirmDialog } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { ModelInfoEditDialog } from './ModelInfoEditDialog';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { logAndFormatError } from '@src/services/error-formatter';
import { RefDeleteError } from '@src/utils/error';

interface ModelHeaderBarProps {
  className?: string;
  model: ModelConfig;
}

export function ModelHeaderBar({
  className,
  model,
}: ModelHeaderBarProps): JSX.Element {
  const { definition, setConfigAndFixReferences } = useProjectDefinition();
  const navigate = useNavigate();
  const { showRefIssues } = useDeleteReferenceDialog();
  const { requestConfirm } = useConfirmDialog();

  const handleDelete = (id: string): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.models = draftConfig.models?.filter((m) => m.id !== id);
      });
      navigate('/data/models');
    } catch (err) {
      if (err instanceof RefDeleteError) {
        showRefIssues({ issues: err.issues });
        return;
      }
      toast.error(logAndFormatError(err));
    }
  };

  return (
    <div className={clsx('flex items-center justify-between', className)}>
      <div>
        <ModelInfoEditDialog asChild>
          <button
            className="group flex items-center space-x-2 hover:cursor-pointer"
            type="button"
            title="Edit Model Info"
          >
            <h1>{model.name}</h1>
            <MdEdit className="invisible size-4 group-hover:visible" />
          </button>
        </ModelInfoEditDialog>
        {model?.feature && (
          <div className="text-xs text-muted-foreground">
            {FeatureUtils.getFeatureById(definition, model.feature)?.name}
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
              content: `Are you sure you want to delete ${model.name}?`,
              buttonConfirmText: 'Delete',
              onConfirm: () => handleDelete(model.id),
            });
          }}
        >
          <Button.Icon icon={MdDeleteOutline} className="text-destructive" />
          <div className="sr-only">Delete Model</div>
        </Button>
      </div>
    </div>
  );
}
