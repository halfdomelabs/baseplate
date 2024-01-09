import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { ComboboxField, InputField } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';

import { useProjectConfig } from 'src/hooks/useProjectConfig';

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
  const { parsedProject } = useProjectConfig();
  const featureOptions = (parsedProject.projectConfig.features ?? []).map(
    (f) => ({
      label: f.name,
      value: f.id,
    }),
  );

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
      <ComboboxField.Controller
        label="Feature"
        description="The feature this model belongs to"
        control={control}
        name="feature"
        options={featureOptions}
        className={horizontal ? 'flex-1' : undefined}
      />
    </div>
  );
}
