import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { Badge } from '@baseplate-dev/ui-components';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { MdFilterList } from 'react-icons/md';

import { ModelIndexDialog } from './model-index-dialog.js';

interface ModelFieldIndexBadgeProps {
  className?: string;
  control: Control<ModelConfigInput>;
  indexId: string;
  autoCollapse?: boolean;
}

export function ModelFieldIndexBadge({
  className,
  control,
  indexId,
  autoCollapse,
}: ModelFieldIndexBadgeProps): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const shouldShowText = !autoCollapse || isHovered;
  const fieldsLength = useWatch({
    control,
    name: 'model.indexes',
    compute: (indexes) =>
      indexes?.find((idx) => idx.id === indexId)?.fields.length ?? 0,
  });
  return (
    <ModelIndexDialog
      control={control}
      indexId={indexId}
      trigger={
        <Badge
          variant="secondary"
          className={clsx('', className)}
          onMouseEnter={() => {
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
          }}
          aria-label="Index"
          title="Index"
        >
          <MdFilterList />
          {shouldShowText &&
            `Index ${fieldsLength > 1 ? `(${fieldsLength})` : ''}`}
        </Badge>
      }
    />
  );
}
