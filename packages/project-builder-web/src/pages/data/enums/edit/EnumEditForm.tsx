import {
  EnumConfig,
  modelEnumValueEntityType,
} from '@halfdomelabs/project-builder-lib';
import { FeatureComboboxField } from '@halfdomelabs/project-builder-lib/web';
import { UseFormReturn, useFieldArray } from 'react-hook-form';

import { hasDirtyFields } from '@src/utils/form';
import { Button, TextInput } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import { underscoreToTitleCase } from 'src/utils/casing';

interface Props {
  form: UseFormReturn<EnumConfig>;
  onSubmit: (config: EnumConfig) => void;
}

function EnumEditForm({ form, onSubmit }: Props): JSX.Element {
  const { control, handleSubmit, setValue, formState, watch } = form;

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
      <FeatureComboboxField.Controller
        label="Feature"
        control={control}
        name="feature"
        canCreate
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
