import {
  EnumConfig,
  modelEnumValueEntityType,
} from '@halfdomelabs/project-builder-lib';
import { SectionList } from '@halfdomelabs/ui-components';
import {
  Control,
  useFieldArray,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';

import { Button, TextInput } from 'src/components';
import { underscoreToTitleCase } from 'src/utils/casing';

export function EnumValuesSection({
  control,
  setValue,
}: {
  control: Control<EnumConfig>;
  setValue: UseFormSetValue<EnumConfig>;
}): JSX.Element {
  const {
    fields: valueFields,
    remove: removeValue,
    append: appendValue,
  } = useFieldArray({
    control,
    name: 'values',
  });

  const values = useWatch({ control, name: 'values' });

  return (
    <SectionList.Section>
      <SectionList.SectionHeader>
        <SectionList.SectionTitle>Values</SectionList.SectionTitle>
        <SectionList.SectionDescription>
          Configure the allowed values for this enum.
        </SectionList.SectionDescription>
      </SectionList.SectionHeader>
      <SectionList.SectionContent className="space-y-4">
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
              <Button
                color="light"
                type="button"
                onClick={() => removeValue(i)}
              >
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
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
