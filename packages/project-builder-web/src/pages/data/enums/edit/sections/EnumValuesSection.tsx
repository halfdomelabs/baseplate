import type { EnumConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { modelEnumValueEntityType } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  InputField,
  Label,
  SectionList,
} from '@halfdomelabs/ui-components';
import { useFieldArray, useWatch } from 'react-hook-form';
import { MdDeleteOutline } from 'react-icons/md';
import { Fragment } from 'react/jsx-runtime';

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
        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
          <Label className="mb-2">Value Name, e.g. ACTIVE</Label>
          <Label className="col-span-2 mb-2">
            Value Friendly Name, e.g. Active
          </Label>
          {valueFields.map((field, i) => (
            <Fragment key={field.id}>
              <InputField.Controller
                control={control}
                name={`values.${i}.name`}
              />
              <InputField.Controller
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
                <Button.Icon icon={MdDeleteOutline} />
                <div className="sr-only">Delete Enum</div>
              </Button>
            </Fragment>
          ))}
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
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
