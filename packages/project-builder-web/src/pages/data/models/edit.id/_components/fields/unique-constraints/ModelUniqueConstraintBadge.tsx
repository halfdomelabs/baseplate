import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Badge } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Control } from 'react-hook-form';
import { MdStar } from 'react-icons/md';

import { ModelUniqueConstraintDialog } from './ModelUniqueConstraintDialog';
import { useEditedModelConfig } from '@src/pages/data/models/_hooks/useEditedModelConfig';

interface ModelFieldUniqueBadgeProps {
  className?: string;
  control: Control<ModelConfig>;
  constraintId: string;
  autoCollapse?: boolean;
}

export function ModelFieldUniqueBadge({
  className,
  control,
  constraintId,
  autoCollapse,
}: ModelFieldUniqueBadgeProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const shouldShowText = !autoCollapse || isHovered;
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Unique Constraint"
        title="Unique Constraint"
      >
        {shouldShowText &&
          `Unique ${fieldsLength > 1 ? `(${fieldsLength})` : ''}`}
      </Badge.WithIcon>
    </ModelUniqueConstraintDialog>
  );
}
