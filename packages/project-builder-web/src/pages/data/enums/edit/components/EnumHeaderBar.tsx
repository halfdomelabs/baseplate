import { EnumConfig, FeatureUtils } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Button, toast, useConfirmDialog } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { EnumInfoEditDialog } from './EnumInfoEditDialog';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { logAndFormatError } from '@src/services/error-formatter';
import { RefDeleteError } from '@src/utils/error';

interface EnumHeaderBarProps {
  className?: string;
  enumDefinition: EnumConfig;
}

export function EnumHeaderBar({
  className,
  enumDefinition,
}: EnumHeaderBarProps): JSX.Element {
  const { definition, setConfigAndFixReferences } = useProjectDefinition();
  const navigate = useNavigate();
  const { showRefIssues } = useDeleteReferenceDialog();
  const { requestConfirm } = useConfirmDialog();

  const handleDelete = (id: string): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.enums = draftConfig.enums?.filter((m) => m.id !== id);
      });
      navigate('/data/enums');
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
        <EnumInfoEditDialog asChild>
          <button
            className="group flex items-center space-x-2 hover:cursor-pointer"
            type="button"
            title="Edit Enum Info"
          >
            <h1>{enumDefinition.name}</h1>
            <MdEdit className="invisible size-4 group-hover:visible" />
          </button>
        </EnumInfoEditDialog>
        {enumDefinition?.feature && (
          <div className="text-xs text-muted-foreground">
            {
              FeatureUtils.getFeatureById(definition, enumDefinition.feature)
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
              buttonConfirmText: 'Delete',
              onConfirm: () => handleDelete(enumDefinition.id),
            });
          }}
        >
          <Button.Icon icon={MdDeleteOutline} className="text-destructive" />
          <div className="sr-only">Delete Enum</div>
        </Button>
      </div>
    </div>
  );
}
