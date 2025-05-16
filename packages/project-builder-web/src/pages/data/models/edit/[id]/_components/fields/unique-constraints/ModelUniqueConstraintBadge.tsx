import type { ModelConfigInput } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { BadgeWithIcon } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { useState } from 'react';
import { MdStar } from 'react-icons/md';

import { useEditedModelConfig } from '@src/pages/data/models/_hooks/useEditedModelConfig';

import { ModelUniqueConstraintDialog } from './ModelUniqueConstraintDialog';

interface ModelFieldUniqueBadgeProps {
  className?: string;
  control: Control<ModelConfigInput>;
  constraintId: string;
  autoCollapse?: boolean;
}

export function ModelFieldUniqueBadge({
  className,
  control,
  constraintId,
  autoCollapse,
}: ModelFieldUniqueBadgeProps): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const shouldShowText = !autoCollapse || isHovered;
  const fieldsLength = useEditedModelConfig(
    (model) =>
      model.model.uniqueConstraints?.find((uc) => uc.id === constraintId)
        ?.fields.length ?? 0,
  );
  return (
    <ModelUniqueConstraintDialog control={control} constraintId={constraintId}>
      <BadgeWithIcon
        variant="secondary"
        icon={MdStar}
        className={clsx('', className)}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        aria-label="Unique Constraint"
        title="Unique Constraint"
      >
        {shouldShowText &&
          `Unique ${fieldsLength > 1 ? `(${fieldsLength})` : ''}`}
      </BadgeWithIcon>
    </ModelUniqueConstraintDialog>
  );
}
