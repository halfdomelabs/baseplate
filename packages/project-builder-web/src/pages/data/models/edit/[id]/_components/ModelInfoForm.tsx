import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { FeatureComboboxFieldController } from '@baseplate-dev/project-builder-lib/web';
import { InputFieldController } from '@baseplate-dev/ui-components';
import { clsx } from 'clsx';

interface ModelInfoFormProps {
  className?: string;
  control: Control<ModelConfigInput>;
}

export function ModelInfoForm({
  className,
  control,
}: ModelInfoFormProps): React.JSX.Element {
  return (
    <div className={clsx('space-y-4', className)}>
      <InputFieldController
        control={control}
        label="Name"
        name="name"
        description="The name of the model (PascalCase)"
      />
      <FeatureComboboxFieldController
        control={control}
        name="featureRef"
        description="The feature this model belongs to (dash-case)"
        canCreate
      />
    </div>
  );
}
