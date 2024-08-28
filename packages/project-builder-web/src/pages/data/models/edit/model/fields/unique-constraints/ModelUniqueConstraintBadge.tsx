import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Badge } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';
import { MdStar } from 'react-icons/md';

import { ModelUniqueConstraintDialog } from './ModelUniqueConstraintDialog';
import { useEditedModelConfig } from '@src/pages/data/models/hooks/useEditedModelConfig';

interface ModelFieldUniqueBadgeProps {
  className?: string;
  control: Control<ModelConfig>;
  constraintId: string;
}

export function ModelFieldUniqueBadge({
  className,
  control,
  constraintId,
}: ModelFieldUniqueBadgeProps): JSX.Element {
  const fieldsLength = useEditedModelConfig(
    (model) =>
      model.model.uniqueConstraints?.find((uc) => uc.id === constraintId)
        ?.fields.length ?? 0,
  );
  return (
    <ModelUniqueConstraintDialog control={control} constraintId={constraintId}>
      <Badge.WithIcon
        variant="secondary"
        icon={MdStar}
        className={clsx('', className)}
      >
        Unique {fieldsLength > 1 ? `(${fieldsLength})` : ''}
      </Badge.WithIcon>
    </ModelUniqueConstraintDialog>
  );
}
