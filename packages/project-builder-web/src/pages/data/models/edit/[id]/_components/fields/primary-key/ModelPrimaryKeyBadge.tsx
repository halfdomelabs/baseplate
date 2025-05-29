import type { ModelConfigInput } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { BadgeWithIcon } from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { MdKey } from 'react-icons/md';

import { ModelPrimaryKeyDialog } from './ModelPrimaryKeyDialog.js';

interface ModelPrimaryKeyBadgeProps {
  className?: string;
  control: Control<ModelConfigInput>;
  autoCollapse?: boolean;
}

export function ModelPrimaryKeyBadge({
  className,
  control,
  autoCollapse,
}: ModelPrimaryKeyBadgeProps): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const shouldShowText = !autoCollapse || isHovered;
  return (
    <ModelPrimaryKeyDialog control={control}>
      <BadgeWithIcon
        icon={MdKey}
        variant="secondary"
        className={className}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        aria-label="Primary Key"
        title="Primary Key"
      >
        {shouldShowText && 'Primary'}
      </BadgeWithIcon>
    </ModelPrimaryKeyDialog>
  );
}
