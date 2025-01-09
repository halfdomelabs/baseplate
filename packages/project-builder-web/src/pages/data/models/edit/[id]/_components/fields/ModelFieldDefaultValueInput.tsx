import type { ModelConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { EnumUtils } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  ComboboxField,
  Dropdown,
  InputField,
  SelectField,
} from '@halfdomelabs/ui-components';
import { useController, useWatch } from 'react-hook-form';
import { HiDotsVertical, HiOutlineX } from 'react-icons/hi';

interface ModelFieldDefaultValueInputProps {
  control: Control<ModelConfig>;
  setValue: UseFormSetValue<ModelConfig>;
  idx: number;
}

export function ModelFieldDefaultValueInput({
  control,
  idx,
  setValue,
}: ModelFieldDefaultValueInputProps): React.JSX.Element {
  const { definition } = useProjectDefinition();
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

  const defaultValue = useWatch({
    control,
    name: `model.fields.${idx}.options.default`,
  });

  if (type === 'boolean') {
    return (
      <div className="flex items-center gap-1">
        <SelectField.Controller
          control={control}
          className="flex-1"
          name={`model.fields.${idx}.options.default`}
          options={[
            { label: 'True', value: 'true' },
            { label: 'False', value: 'false' },
          ]}
          placeholder="NULL"
        />
        {defaultValue && (
          <Button.WithOnlyIcon
            title="Reset"
            icon={HiOutlineX}
            onClick={() => {
              setValue(`model.fields.${idx}.options.default`, '', {
                shouldDirty: true,
              });
            }}
            variant="ghost"
            size="icon"
          />
        )}
      </div>
    );
  }

  if (['string', 'int', 'float'].includes(type)) {
    return (
      <div className="flex items-center gap-1">
        <InputField.Controller
          control={control}
          placeholder="NULL"
          name={`model.fields.${idx}.options.default`}
          className="flex-1"
        />
        {defaultValue && (
          <Button.WithOnlyIcon
            title="Reset"
            icon={HiOutlineX}
            onClick={() => {
              setValue(`model.fields.${idx}.options.default`, undefined, {
                shouldDirty: true,
              });
            }}
            variant="ghost"
            size="icon"
          />
        )}
      </div>
    );
  }

  if (type === 'uuid') {
    if (optionsValue?.genUuid) {
      return (
        <div className="flex items-center gap-1">
          <InputField disabled value="Random UUID v4" className="flex-1" />
          <Button.WithOnlyIcon
            title="Reset"
            icon={HiOutlineX}
            onClick={() => {
              onOptionsChange({ ...optionsValue, genUuid: false });
            }}
            variant="ghost"
            size="icon"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <InputField.Controller
          control={control}
          placeholder="NULL"
          name={`model.fields.${idx}.options.default`}
          className="flex-1"
        />
        <Dropdown>
          <Dropdown.Trigger asChild>
            <Button.WithOnlyIcon
              title="Options"
              variant="ghost"
              size="icon"
              icon={HiDotsVertical}
            />
          </Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Group>
              <Dropdown.Item
                onSelect={() => {
                  onOptionsChange({
                    ...optionsValue,
                    genUuid: true,
                  });
                }}
              >
                Random UUID v4
              </Dropdown.Item>
            </Dropdown.Group>
          </Dropdown.Content>
        </Dropdown>
      </div>
    );
  }

  if (type === 'dateTime' || type === 'date') {
    const { defaultToNow, updatedAt } = optionsValue ?? {};

    if (defaultToNow ?? updatedAt) {
      return (
        <div className="flex items-center gap-1">
          <InputField
            disabled
            value={updatedAt ? 'Last Updated' : 'Now'}
            className="flex-1"
          />
          <Button.WithOnlyIcon
            title="Reset"
            icon={HiOutlineX}
            onClick={() => {
              onOptionsChange({
                ...optionsValue,
                defaultToNow: false,
                updatedAt: false,
              });
            }}
            variant="ghost"
            size="icon"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1">
        <InputField.Controller
          placeholder="NULL"
          control={control}
          name={`model.fields.${idx}.options.default`}
          className="flex-1"
        />
        <Dropdown>
          <Dropdown.Trigger asChild>
            <Button.WithOnlyIcon
              title="Options"
              variant="ghost"
              size="icon"
              icon={HiDotsVertical}
            />
          </Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Group>
              <Dropdown.Item
                onSelect={() => {
                  onOptionsChange({
                    ...optionsValue,
                    defaultToNow: true,
                    updatedAt: false,
                  });
                }}
              >
                Now
              </Dropdown.Item>
              <Dropdown.Item
                onSelect={() => {
                  onOptionsChange({
                    ...optionsValue,
                    defaultToNow: true,
                    updatedAt: true,
                  });
                }}
              >
                Last Updated At
              </Dropdown.Item>
            </Dropdown.Group>
          </Dropdown.Content>
        </Dropdown>
      </div>
    );
  }

  if (type === 'enum' && optionsValue?.enumType) {
    const fieldEnum = EnumUtils.byIdOrThrow(definition, optionsValue.enumType);
    const enumValues = fieldEnum.values.map((v) => ({
      label: v.friendlyName,
      value: v.id,
    }));
    return (
      <div className="flex items-center space-x-1">
        <ComboboxField
          placeholder="NULL"
          value={optionsValue.defaultEnumValue ?? null}
          onChange={(value) => {
            onOptionsChange({
              ...optionsValue,
              defaultEnumValue: value ? value : undefined,
            });
          }}
          options={enumValues}
          className="flex-1"
        />
        {optionsValue.defaultEnumValue && (
          <Button.WithOnlyIcon
            title="Reset"
            icon={HiOutlineX}
            onClick={() => {
              onOptionsChange({
                ...optionsValue,
                defaultEnumValue: '',
              });
            }}
            variant="ghost"
            size="icon"
          />
        )}
      </div>
    );
  }

  return <div />;
}
