import {
  EnumConfig,
  enumSchema,
} from '@baseplate/project-builder-lib/lib/schema/models/enums';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button, TextInput } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

interface Props {
  config: EnumConfig | undefined;
  onSubmit: (config: EnumConfig) => void;
}

function EnumEditForm({ config, onSubmit }: Props): JSX.Element {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: config,
    resolver: zodResolver(enumSchema),
  });

  useEffect(() => {
    reset(config);
  }, [config, reset]);

  const { parsedProject } = useProjectConfig();

  const featureOptions = (parsedProject.projectConfig.features || []).map(
    (f) => ({
      label: f.name,
      value: f.name,
    })
  );

  const {
    fields: valueFields,
    remove: removeValue,
    append: appendValue,
  } = useFieldArray({
    control,
    name: 'values',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <TextInput.LabelledController
        label="Name (e.g. User)"
        control={control}
        name="name"
      />
      <ReactSelectInput.LabelledController
        label="Feature"
        control={control}
        name="feature"
        options={featureOptions}
      />
      <CheckedInput.LabelledController
        label="Is Exposed?"
        control={control}
        name="isExposed"
      />
      <h3>Values</h3>
      {valueFields.map((field, i) => (
        <div key={field.id}>
          <div className="flex flex-row space-x-4">
            <TextInput.LabelledController
              label="Value Name, e.g. ACTIVE"
              control={control}
              name={`values.${i}.name`}
            />
            <TextInput.LabelledController
              label="Value Friendly Name, e.g. Active"
              control={control}
              name={`values.${i}.friendlyName`}
            />
            <Button color="light" type="button" onClick={() => removeValue(i)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" onClick={() => appendValue({})}>
        Add Value
      </Button>
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export default EnumEditForm;
