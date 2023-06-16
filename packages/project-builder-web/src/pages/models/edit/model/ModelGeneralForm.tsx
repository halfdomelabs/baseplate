import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { SelectInput, TextInput } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control } from 'react-hook-form';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

interface ModelGeneralFormProps {
  className?: string;
  control: Control<ModelConfig>;
}

export function ModelGeneralForm({
  className,
  control,
}: ModelGeneralFormProps): JSX.Element {
  const { parsedProject } = useProjectConfig();
  const featureOptions = (parsedProject.projectConfig.features || []).map(
    (f) => ({
      label: f.name,
      value: f.name,
    })
  );

  return (
    <div className={clsx('', className)}>
      <div className="flex w-full space-x-4">
        <TextInput.Controller
          className="flex-1"
          label="Name"
          description="The name of the model (PascalCase)"
          control={control}
          name="name"
        />
        <SelectInput.Controller
          className="flex-1"
          label="Feature"
          description="The feature this model belongs to"
          control={control}
          name="feature"
          options={featureOptions}
        />
      </div>
    </div>
  );
}
