import {
  ModelConfig,
  ModelRelationFieldConfig,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Badge } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useState } from 'react';
import { Control } from 'react-hook-form';
import { MdLink } from 'react-icons/md';

import { ModelRelationDialog } from './ModelRelationDialog';

interface ModelRelationBadgeProps {
  className?: string;
  control: Control<ModelConfig>;
  relation: ModelRelationFieldConfig;
  autoCollapse?: boolean;
}

export function ModelRelationsBadge({
  className,
  control,
  relation,
  autoCollapse,
}: ModelRelationBadgeProps): JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  const [isHovered, setIsHovered] = useState(false);
  const shouldShowText = !autoCollapse || isHovered;
  return (
    <ModelRelationDialog control={control} relationId={relation.id}>
      <Badge.WithIcon
        icon={MdLink}
        variant="secondary"
        className={clsx('max-w-[100px]', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Relation"
        title="Relation"
      >
        {shouldShowText &&
          `${definitionContainer.nameFromId(relation.modelName)} ${
            relation.references.length > 1
              ? `(${relation.references.length})`
              : ''
          }`}
      </Badge.WithIcon>
    </ModelRelationDialog>
  );
}
