import {
  ModelConfig,
  ModelRelationFieldConfig,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Badge } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';
import { MdLink } from 'react-icons/md';

import { ModelFieldRelationsDialog } from '../ModelFieldRelationsDialog';

interface ModelFieldRelationBadgeProps {
  className?: string;
  control: Control<ModelConfig>;
  fieldIdx: number;
  relation: ModelRelationFieldConfig;
}

export function ModelFieldRelationBadge({
  className,
  control,
  fieldIdx,
  relation,
}: ModelFieldRelationBadgeProps): JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  return (
    <ModelFieldRelationsDialog control={control} fieldIdx={fieldIdx}>
      <Badge.WithIcon
        className={clsx('max-w-[100px]', className)}
        variant="secondary"
        icon={MdLink}
      >
        {definitionContainer.nameFromId(relation.modelName)}
      </Badge.WithIcon>
    </ModelFieldRelationsDialog>
  );
}
