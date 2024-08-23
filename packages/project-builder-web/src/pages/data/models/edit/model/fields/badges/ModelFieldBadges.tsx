import { ModelConfig, ModelUtils } from '@halfdomelabs/project-builder-lib';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';

import { ModelFieldPrimaryBadge } from './ModelFieldPrimaryBadge';
import { ModelFieldRelationBadge } from './ModelFieldRelationBadge';
import { ModelFieldUniqueBadge } from './ModelFieldUniqueBadge';
import { useEditedModelConfig } from '../../../../hooks/useEditedModelConfig';

interface ModelFieldBadgesProps {
  className?: string;
  control: Control<ModelConfig>;
  idx: number;
}

export function ModelFieldBadges({
  className,
  control,
  idx,
}: ModelFieldBadgesProps): JSX.Element {
  const field = useEditedModelConfig((model) => model.model.fields[idx]);
  const isPrimary = useEditedModelConfig((model) => {
    return ModelUtils.getModelIdFields(model).includes(field.id);
  });
  const isUnique = field.isUnique;
  const modelFieldRelations = useEditedModelConfig(({ model }) => {
    const field = model.fields[idx];
    return (
      model.relations?.filter((r) =>
        r.references.some((ref) => ref.local === field.id),
      ) ?? []
    );
  });

  const badges = [
    isPrimary && <ModelFieldPrimaryBadge />,
    isUnique && <ModelFieldUniqueBadge />,
    ...modelFieldRelations.map((relation) => (
      <ModelFieldRelationBadge
        key={relation.id}
        control={control}
        fieldIdx={idx}
        relation={relation}
      />
    )),
  ];

  return <div className={clsx('flex gap-4', className)}>{badges}</div>;
}
