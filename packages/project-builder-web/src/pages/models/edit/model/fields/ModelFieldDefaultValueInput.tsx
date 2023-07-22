import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  ComboboxInput,
  Dropdown,
  TextInput,
} from '@halfdomelabs/ui-components';
import { Control, useController, useWatch } from 'react-hook-form';
import { HiOutlineX } from 'react-icons/hi';

interface ModelFieldDefaultValueInputProps {
  control: Control<ModelConfig>;
  idx: number;
}

interface EnumValue {
  uid: string;
  name: string;
  friendlyName: string;
}

export function ModelFieldDefaultValueInput({
  control,
  idx,
}: ModelFieldDefaultValueInputProps): JSX.Element {
  const type = useWatch({
    control,
    name: `model.fields.${idx}.type`,
  });

  const {
    field: { value: optionsValue, onChange: onOptionsChange },
  } = useController({
    name: `model.fields.${idx}.options`,
    control,
  });

  if (['string', 'int', 'float', 'boolean'].includes(type)) {
    return (
      <TextInput.Controller
        control={control}
        placeholder="NULL"
        name={`model.fields.${idx}.options.default`}
      />
    );
  }
  if (type === 'enum' && optionsValue?.enumValues) {
    return (
      <ComboboxInput.Controller
        getOptionLabel={(option) => option}
        getOptionValue={(option) => option}
        control={control}
        name={`model.fields.${idx}.options.default`}
        label=""
        description=""
        options={(optionsValue.enumValues as EnumValue[]).map(
          (value) => value.friendlyName
        )}
      />
    );
  }
  if (type === 'uuid') {
    if (optionsValue?.genUuid) {
      return (
        <div className="flex items-center space-x-1">
          <TextInput disabled value="Random UUID v4" />
          <Button
            title="Reset"
            onClick={() => onOptionsChange({ ...optionsValue, genUuid: false })}
            iconAfter={HiOutlineX}
            variant="tertiary"
            size="icon"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1">
        <TextInput.Controller
          control={control}
          placeholder="NULL"
          name={`model.fields.${idx}.options.default`}
        />
        <Dropdown variant="tertiary" size="icon">
          <Dropdown.ButtonItem
            onClick={() =>
              onOptionsChange({
                ...optionsValue,
                genUuid: true,
              })
            }
          >
            Random UUID v4
          </Dropdown.ButtonItem>
        </Dropdown>
      </div>
    );
  }

  if (type === 'dateTime' || type === 'date') {
    const { defaultToNow, updatedAt } = optionsValue || {};

    if (defaultToNow || updatedAt) {
      return (
        <div className="flex items-center space-x-1">
          <TextInput disabled value={updatedAt ? 'Last Updated' : 'Now'} />
          <Button
            title="Reset"
            onClick={() =>
              onOptionsChange({
                ...optionsValue,
                defaultToNow: false,
                updatedAt: false,
              })
            }
            iconAfter={HiOutlineX}
            variant="tertiary"
            size="icon"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1">
        <TextInput.Controller
          placeholder="NULL"
          control={control}
          name={`model.fields.${idx}.options.default`}
        />
        <Dropdown variant="tertiary" size="icon">
          <Dropdown.ButtonItem
            onClick={() =>
              onOptionsChange({
                ...optionsValue,
                defaultToNow: true,
              })
            }
          >
            Now
          </Dropdown.ButtonItem>
          <Dropdown.ButtonItem
            onClick={() =>
              onOptionsChange({
                ...optionsValue,
                defaultToNow: true,
                updatedAt: true,
              })
            }
          >
            Last Updated At
          </Dropdown.ButtonItem>
        </Dropdown>
      </div>
    );
  }

  return <div />;
}
