import {
  EnumConfig,
  enumSchema,
  modelEnumValueEntityType,
} from '@halfdomelabs/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';

import { useBlockDirtyFormNavigate } from '@src/hooks/useBlockDirtyFormNavigate';
import { hasDirtyFields } from '@src/utils/form';
import { Button, TextInput } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { underscoreToTitleCase } from 'src/utils/casing';

interface Props {
  config: EnumConfig | undefined;
  onSubmit: (config: EnumConfig) => void;
}

function EnumEditForm({ config, onSubmit }: Props): JSX.Element {
  const { control, handleSubmit, reset, watch, setValue, formState } =
    useResettableForm({
      defaultValues: config,
      resolver: zodResolver(enumSchema),
    });

  useBlockDirtyFormNavigate(formState);

  useEffect(() => {
    reset(config);
  }, [config, reset]);

  const { parsedProject } = useProjectDefinition();

  const featureOptions = (parsedProject.projectDefinition.features ?? []).map(
    (f) => ({
      label: f.name,
      value: f.id,
    }),
  );

  const {
    fields: valueFields,
    remove: removeValue,
    append: appendValue,
  } = useFieldArray({
    control,
    name: 'values',
  });

  const values = watch('values');

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
              onFocus={() => {
                if (!values[i].friendlyName && values[i].name) {
                  setValue(
                    `values.${i}.friendlyName`,
                    underscoreToTitleCase(values[i].name),
                  );
                }
              }}
            />
            <Button color="light" type="button" onClick={() => removeValue(i)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        onClick={() =>
          appendValue({
            id: modelEnumValueEntityType.generateNewId(),
            name: '',
            friendlyName: '',
          })
        }
      >
        Add Value
      </Button>
      <div>
        <Button type="submit" disabled={!hasDirtyFields(formState)}>
          Save
        </Button>
      </div>
    </form>
  );
}

export default EnumEditForm;
