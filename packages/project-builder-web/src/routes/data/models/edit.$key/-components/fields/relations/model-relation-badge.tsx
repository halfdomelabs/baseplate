import type {
  ModelConfigInput,
  ModelRelationFieldConfigInput,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { BadgeWithIcon } from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { useState } from 'react';
import { MdLink } from 'react-icons/md';

import { ModelRelationDialog } from './model-relation-dialog.js';

interface ModelRelationBadgeProps {
  className?: string;
  control: Control<ModelConfigInput>;
  relation: ModelRelationFieldConfigInput;
  autoCollapse?: boolean;
}

export function ModelRelationsBadge({
  className,
  control,
  relation,
  autoCollapse,
}: ModelRelationBadgeProps): React.JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  const [isHovered, setIsHovered] = useState(false);
  const shouldShowText = !autoCollapse || isHovered;
  return (
    <ModelRelationDialog control={control} relationId={relation.id}>
      <BadgeWithIcon
        icon={MdLink}
        variant="secondary"
        className={clsx('max-w-[100px]', className)}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        aria-label="Relation"
        title="Relation"
      >
        {shouldShowText &&
          `${definitionContainer.nameFromId(relation.modelRef)} ${
            relation.references.length > 1
              ? `(${relation.references.length})`
              : ''
          }`}
      </BadgeWithIcon>
    </ModelRelationDialog>
  );
}
