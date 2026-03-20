import type { EnumConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { modelEnumValueEntityType } from '@baseplate-dev/project-builder-lib';
import {
  Button,
  InputFieldController,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { useFieldArray, useWatch } from 'react-hook-form';
import { MdDeleteOutline } from 'react-icons/md';

import { SortableList } from '#src/components/index.js';
import { underscoreToTitleCase } from '#src/utils/casing.js';

export function EnumValuesSection({
  control,
  setValue,
}: {
  control: Control<EnumConfigInput>;
  setValue: UseFormSetValue<EnumConfigInput>;
}): React.JSX.Element {
  const {
    fields: valueFields,
    remove: removeValue,
    append: appendValue,
    move: sortValues,
  } = useFieldArray({
    control,
    name: 'values',
  });

  const values = useWatch({ control, name: 'values' });

  const valueListItems = valueFields.map((field, i) => ({
    id: field.id,
    element: (
      <div className="grid grid-cols-[repeat(3,minmax(130px,1fr))_40px] items-start gap-3 border-b pb-4">
        <InputFieldController
          control={control}
          name={`values.${i}.name`}
          label="Value Name"
        />
        <InputFieldController
          control={control}
          name={`values.${i}.friendlyName`}
          label="Friendly Name"
          onFocus={() => {
            if (!values[i].friendlyName && values[i].name) {
              setValue(
                `values.${i}.friendlyName`,
                underscoreToTitleCase(values[i].name),
              );
            }
          }}
        />
        <InputFieldController
          control={control}
          name={`values.${i}.description`}
          label="Optional Description"
          placeholder="Enter description"
        />
        <Button
          className="mt-6"
          variant="ghost"
          size="icon"
          onClick={() => {
            removeValue(i);
          }}
        >
          <MdDeleteOutline />
          <div className="sr-only">Delete Enum</div>
        </Button>
      </div>
    ),
  }));

  return (
    <SectionListSection>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Enum Values</SectionListSectionTitle>
        <SectionListSectionDescription>
          Configure the allowed values for this enum.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="space-y-4">
        {valueFields.length === 0 ? (
          <p className="pt-4 text-style-muted">
            Add some values to get started
          </p>
        ) : (
          <SortableList listItems={valueListItems} sortItems={sortValues} />
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            appendValue({
              id: modelEnumValueEntityType.generateNewId(),
              name: '',
              friendlyName: '',
              description: '',
            });
          }}
        >
          Add Value
        </Button>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
