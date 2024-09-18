import { EnumConfig } from '@halfdomelabs/project-builder-lib';
import { FeatureComboboxField } from '@halfdomelabs/project-builder-lib/web';
import { InputField } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';

interface Props {
  className?: string;
  control: Control<EnumConfig>;
}

export function EnumInfoForm({ className, control }: Props): JSX.Element {
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
        name="feature"
        description="The feature this enum belongs to (dash-case)"
        canCreate
      />
    </div>
  );
}
