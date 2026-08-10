import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { Badge } from '@baseplate-dev/ui-components';
import { useState } from 'react';
import { MdOutlineDescription } from 'react-icons/md';

import { ModelFieldDescriptionDialog } from './model-field-description-dialog.js';

interface ModelFieldDescriptionBadgeProps {
  className?: string;
  control: Control<ModelConfigInput>;
  idx: number;
  autoCollapse?: boolean;
}

export function ModelFieldDescriptionBadge({
  className,
  control,
  idx,
  autoCollapse,
}: ModelFieldDescriptionBadgeProps): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const shouldShowText = !autoCollapse || isHovered;
  return (
    <ModelFieldDescriptionDialog
      control={control}
      idx={idx}
      trigger={
        <Badge
          variant="secondary"
          render={<button type="button" />}
          className={className}
          onMouseEnter={() => {
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
          }}
          aria-label="Description"
          title="Description"
        >
          <MdOutlineDescription />
          {shouldShowText && 'Description'}
        </Badge>
      }
    />
  );
}
