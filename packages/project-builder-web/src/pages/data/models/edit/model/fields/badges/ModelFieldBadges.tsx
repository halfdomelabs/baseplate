import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';

import { useEditedModelConfig } from '../../../../_hooks/useEditedModelConfig';
import { ModelPrimaryKeyBadge } from '../primary-key/ModelPrimaryKeyBadge';
import { ModelRelationsBadge } from '../relations/ModelRelationBadge';
import { ModelFieldUniqueBadge } from '../unique-constraints/ModelUniqueConstraintBadge';

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
  const { isPrimary, uniqueConstraints } = useEditedModelConfig((model) => {
    return {
      isPrimary: model.model.primaryKeyFieldRefs.includes(field.id),
      uniqueConstraints:
        model.model.uniqueConstraints
          ?.filter((constraint) =>
            constraint.fields.some((f) => f.fieldRef === field.id),
          )
          .map((uc) => uc.id) ?? [],
    };
  });
  const modelFieldRelations = useEditedModelConfig(({ model }) => {
    const field = model.fields[idx];
    return (
      model.relations?.filter((r) =>
        r.references.some((ref) => ref.local === field.id),
      ) ?? []
    );
  });

  const totalBadges =
    (isPrimary ? 1 : 0) + uniqueConstraints.length + modelFieldRelations.length;
  const autoCollapse = totalBadges > 2;

  const badges = [
    isPrimary && (
      <ModelPrimaryKeyBadge
        key={'primary'}
        control={control}
        autoCollapse={autoCollapse}
      />
    ),
    ...uniqueConstraints.map((uc) => (
      <ModelFieldUniqueBadge
        key={uc}
        control={control}
        constraintId={uc}
        autoCollapse={autoCollapse}
      />
    )),
    ...modelFieldRelations.map((relation) => (
      <ModelRelationsBadge
        key={relation.id}
        control={control}
        relation={relation}
        autoCollapse={autoCollapse}
      />
    )),
  ];

  return <div className={clsx('flex gap-4', className)}>{badges}</div>;
}
