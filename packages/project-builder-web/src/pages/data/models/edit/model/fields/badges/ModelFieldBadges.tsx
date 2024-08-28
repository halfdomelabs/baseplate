import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';

import { useEditedModelConfig } from '../../../../hooks/useEditedModelConfig';
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

  const badges = [
    isPrimary && <ModelPrimaryKeyBadge key={'primary'} control={control} />,
    ...uniqueConstraints.map((uc) => (
      <ModelFieldUniqueBadge key="unique" control={control} constraintId={uc} />
    )),
    ...modelFieldRelations.map((relation) => (
      <ModelRelationsBadge
        key={relation.id}
        control={control}
        relation={relation}
      />
    )),
  ];

  return <div className={clsx('flex gap-4', className)}>{badges}</div>;
}
