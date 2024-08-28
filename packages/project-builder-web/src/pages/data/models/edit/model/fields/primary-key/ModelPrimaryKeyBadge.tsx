import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Badge } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';
import { MdKey } from 'react-icons/md';

import { ModelPrimaryKeyDialog } from './ModelPrimaryKeyDialog';

interface ModelPrimaryKeyBadgeProps {
  className?: string;
  control: Control<ModelConfig>;
}

export function ModelPrimaryKeyBadge({
  className,
  control,
}: ModelPrimaryKeyBadgeProps): JSX.Element {
  return (
    <ModelPrimaryKeyDialog control={control}>
      <Badge.WithIcon icon={MdKey} variant="secondary" className={className}>
        Primary
      </Badge.WithIcon>
    </ModelPrimaryKeyDialog>
  );
}
