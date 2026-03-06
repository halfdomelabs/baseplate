import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { clsx } from 'clsx';
import { useWatch } from 'react-hook-form';

import { ModelPrimaryKeyBadge } from '../primary-key/model-primary-key-badge.js';
import { ModelRelationsBadge } from '../relations/model-relation-badge.js';
import { ModelFieldUniqueBadge } from '../unique-constraints/model-unique-constraint-badge.js';

interface ModelFieldBadgesProps {
  className?: string;
  control: Control<ModelConfigInput>;
  idx: number;
}

export function ModelFieldBadges({
  className,
  control,
  idx,
}: ModelFieldBadgesProps): React.JSX.Element {
  const field = useWatch({ control, name: `model.fields.${idx}` });
  const isPrimary = useWatch({
    control,
    name: 'model.primaryKeyFieldRefs',
    compute: (refs) => refs.includes(field.id),
  });
  const uniqueConstraints = useWatch({
    control,
    name: 'model.uniqueConstraints',
    compute: (constraints) =>
      constraints
        ?.filter((constraint) =>
          constraint.fields.some((f) => f.fieldRef === field.id),
        )
        .map((uc) => uc.id) ?? [],
  });
  const modelFieldRelations = useWatch({
    control,
    name: 'model.relations',
    compute: (relations) =>
      relations?.filter((r) =>
        r.references.some((ref) => ref.localRef === field.id),
      ) ?? [],
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
