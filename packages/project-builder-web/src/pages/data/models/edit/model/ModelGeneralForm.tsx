import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { FeatureComboboxField } from '@halfdomelabs/project-builder-lib/web';
import { InputField } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';

interface ModelGeneralFormProps {
  className?: string;
  control: Control<ModelConfig>;
  horizontal?: boolean;
}

export function ModelGeneralForm({
  className,
  control,
  horizontal,
}: ModelGeneralFormProps): JSX.Element {
  return (
    <div
      className={clsx(horizontal ? 'flex space-x-4' : 'space-y-4', className)}
    >
      <InputField.Controller
        label="Name"
        description="The name of the model (PascalCase)"
        control={control}
        name="name"
        className={horizontal ? 'flex-1' : undefined}
      />
      <FeatureComboboxField.Controller
        label="Feature"
        description="The feature this model belongs to"
        control={control}
        name="feature"
        className={horizontal ? 'flex-1' : undefined}
        canCreate
      />
    </div>
  );
}
