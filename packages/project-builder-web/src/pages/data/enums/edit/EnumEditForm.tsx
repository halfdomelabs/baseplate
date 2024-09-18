import {
  EnumConfig,
  modelEnumValueEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import DataFormActionBar from '../../components/DataFormActionBar';
import { Button, TextInput } from 'src/components';
import { underscoreToTitleCase } from 'src/utils/casing';

function EnumEditForm({
  form,
  onSubmit,
}: {
  form: UseFormReturn<EnumConfig>;
  onSubmit: () => Promise<void>;
}): JSX.Element {
  const { control, setValue, formState, watch, reset } = form;

  const {
    fields: valueFields,
    remove: removeValue,
    append: appendValue,
  } = useFieldArray({
    control,
    name: 'values',
  });

  const values = watch('values');

  useBlockUnsavedChangesNavigate(formState, { reset, onSubmit });

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-4">
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
      <DataFormActionBar form={form} />
    </form>
  );
}

export default EnumEditForm;
