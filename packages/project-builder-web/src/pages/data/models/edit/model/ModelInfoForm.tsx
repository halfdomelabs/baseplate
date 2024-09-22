import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { FeatureComboboxField } from '@halfdomelabs/project-builder-lib/web';
import { InputField } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';

interface ModelInfoFormProps {
  className?: string;
  control: Control<ModelConfig>;
}

export function ModelInfoForm({
  className,
  control,
}: ModelInfoFormProps): JSX.Element {
  return (
    <div className={clsx('space-y-4', className)}>
      <InputField.Controller
        control={control}
        label="Name"
        name="name"
        description="The name of the model (PascalCase)"
      />
      <FeatureComboboxField.Controller
        control={control}
        name="feature"
        description="The feature this model belongs to (dash-case)"
        canCreate
      />
    </div>
  );
}
