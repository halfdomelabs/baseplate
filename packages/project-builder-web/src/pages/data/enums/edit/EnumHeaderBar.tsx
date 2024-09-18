import { EnumConfig, FeatureUtils } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { SwitchField, toast } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { EnumOptionsDropdown } from './EnumOptionsDropdown';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { logAndFormatError } from '@src/services/error-formatter';
import { RefDeleteError } from '@src/utils/error';

interface ModelHeaderBarProps {
  form: UseFormReturn<EnumConfig>;
  className?: string;
  enumDefinition: EnumConfig;
}

export function EnumHeaderBar({
  form,
  className,
  enumDefinition,
}: ModelHeaderBarProps): JSX.Element {
  const { definition, setConfigAndFixReferences } = useProjectDefinition();
  const navigate = useNavigate();
  const { showRefIssues } = useDeleteReferenceDialog();

  const { control } = form;

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
    <div className={clsx('flex items-center justify-between px-4', className)}>
      <div>
        <h1>{enumDefinition.name}</h1>
        {enumDefinition?.feature && (
          <div className="text-xs text-muted-foreground">
            {
              FeatureUtils.getFeatureById(definition, enumDefinition.feature)
                ?.name
            }
          </div>
        )}
      </div>
      <div className="flex items-center gap-8">
        <SwitchField.Controller
          control={control}
          name="isExposed"
          label="Expose in GraphQL schema?"
        />
        <EnumOptionsDropdown
          enumDefinition={enumDefinition}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
}
