import type { EnumConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { FeatureComboboxField } from '@halfdomelabs/project-builder-lib/web';
import { InputField } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';

interface Props {
  className?: string;
  control: Control<EnumConfig>;
}

export function EnumInfoForm({ className, control }: Props): React.JSX.Element {
  return (
    <div className={clsx('max-w-md space-y-4', className)}>
      <InputField.Controller
        label="Name"
        control={control}
        name="name"
        description="The name of the enum (PascalCase)"
      />
      <FeatureComboboxField.Controller
        label="Feature"
        control={control}
        name="featureRef"
        description="The feature this enum belongs to (dash-case)"
        canCreate
      />
    </div>
  );
}
