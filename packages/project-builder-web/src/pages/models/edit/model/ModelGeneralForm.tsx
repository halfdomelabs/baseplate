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
      <div className="space-y-4">
        <TextInput.Controller
          label="Name"
          description="The name of the model (PascalCase)"
          control={control}
          name="name"
        />
        <SelectInput.Controller
          label="Feature"
          description="The feature this model belongs to"
          control={control}
          name="feature"
          options={featureOptions}
          fixed
        />
      </div>
    </div>
  );
}
