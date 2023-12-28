import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { Control, useWatch } from 'react-hook-form';

import SelectArrayInput from 'src/components/SelectArrayInput';

interface Props {
  className?: string;
  control: Control<ModelConfig>;
}

function ModelPrimaryKeyForm({ className, control }: Props): JSX.Element {
  const localFields = useWatch({ control, name: `model.fields` });

  const localFieldOptions =
    localFields?.map((f) => ({
      label: f.name,
      value: f.id,
    })) ?? [];

  return (
    <div className={classNames('w-1/2 min-w-[400px] space-y-4', className)}>
      <div>
        <h2>Primary Keys</h2>
        <p className="text-xs text-muted-foreground">
          Only use this if you plan on having more than one primary key
        </p>
      </div>
      <SelectArrayInput.LabelledController
        name="model.primaryKeys"
        control={control}
        options={localFieldOptions}
        uniqueValues
      />
    </div>
  );
}

export default ModelPrimaryKeyForm;
