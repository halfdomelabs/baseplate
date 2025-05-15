import type { EnumConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { modelEnumValueEntityType } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  InputFieldController,
  Label,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useFieldArray, useWatch } from 'react-hook-form';
import { MdDeleteOutline } from 'react-icons/md';

import { SortableList } from '@src/components';
import { underscoreToTitleCase } from '@src/utils/casing';

export function EnumValuesSection({
  control,
  setValue,
}: {
  control: Control<EnumConfig>;
  setValue: UseFormSetValue<EnumConfig>;
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

  const gridClassNames =
    'grid grid-cols-[repeat(2,minmax(130px,1fr))_80px] gap-3';

  const valueListItems = valueFields.map((field, i) => ({
    id: field.id,
    element: (
      <div className={gridClassNames}>
        <InputFieldController control={control} name={`values.${i}.name`} />
        <InputFieldController
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
        <SectionListSectionTitle>Values</SectionListSectionTitle>
        <SectionListSectionDescription>
          Configure the allowed values for this enum.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="space-y-4">
        <div className="space-y-2">
          <div
            className={clsx(
              gridClassNames,
              // account for handle in sortable list
              'pl-12',
            )}
          >
            <Label>Value Name, e.g. ACTIVE</Label>
            <Label>Value Friendly Name, e.g. Active</Label>
            <div />
          </div>
          {valueFields.length === 0 ? (
            <p className="pt-4 text-style-muted">
              Add some values to get started
            </p>
          ) : (
            <SortableList listItems={valueListItems} sortItems={sortValues} />
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            appendValue({
              id: modelEnumValueEntityType.generateNewId(),
              name: '',
              friendlyName: '',
            });
          }}
        >
          Add Value
        </Button>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
