import type { EnumConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { FeatureComboboxFieldController } from '@baseplate-dev/project-builder-lib/web';
import { InputFieldController } from '@baseplate-dev/ui-components';
import { clsx } from 'clsx';

interface Props {
  className?: string;
  control: Control<EnumConfig>;
}

export function EnumInfoForm({ className, control }: Props): React.JSX.Element {
  return (
    <div className={clsx('max-w-md space-y-4', className)}>
      <InputFieldController
        label="Name"
        control={control}
        name="name"
        description="The name of the enum (PascalCase)"
      />
      <FeatureComboboxFieldController
        label="Feature"
        control={control}
        name="featureRef"
        description="The feature this enum belongs to (dash-case)"
        canCreate
      />
    </div>
  );
}
