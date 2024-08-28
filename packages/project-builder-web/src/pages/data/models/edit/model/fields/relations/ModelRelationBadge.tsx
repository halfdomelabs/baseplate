import {
  ModelConfig,
  ModelRelationFieldConfig,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Badge } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { Control } from 'react-hook-form';
import { MdLink } from 'react-icons/md';

import { ModelRelationDialog } from './ModelRelationDialog';

interface ModelRelationBadgeProps {
  className?: string;
  control: Control<ModelConfig>;
  relation: ModelRelationFieldConfig;
}

export function ModelRelationsBadge({
  className,
  control,
  relation,
}: ModelRelationBadgeProps): JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  return (
    <ModelRelationDialog control={control} relationId={relation.id}>
      <Badge.WithIcon
        icon={MdLink}
        variant="secondary"
        className={clsx('max-w-[100px]', className)}
      >
        {definitionContainer.nameFromId(relation.modelName)}
        {relation.references.length > 1
          ? ` (${relation.references.length})`
          : ''}
      </Badge.WithIcon>
    </ModelRelationDialog>
  );
}
