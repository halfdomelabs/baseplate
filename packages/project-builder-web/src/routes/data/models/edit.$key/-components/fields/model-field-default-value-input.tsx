import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { EnumUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  ComboboxField,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputField,
  InputFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';
import { useController, useWatch } from 'react-hook-form';
import { HiDotsVertical, HiOutlineX } from 'react-icons/hi';

interface ModelFieldDefaultValueInputProps {
  control: Control<ModelConfigInput>;
  setValue: UseFormSetValue<ModelConfigInput>;
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
        <SelectFieldController
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
          <Button
            title="Reset"
            onClick={() => {
              setValue(`model.fields.${idx}.options.default`, '', {
                shouldDirty: true,
              });
            }}
            variant="ghost"
            size="icon"
          >
            <HiOutlineX />
          </Button>
        )}
      </div>
    );
  }

  if (['string', 'int', 'float'].includes(type)) {
    return (
      <div className="flex items-center gap-1">
        <InputFieldController
          control={control}
          placeholder="NULL"
          name={`model.fields.${idx}.options.default`}
          className="flex-1"
        />
        {defaultValue && (
          <Button
            title="Reset"
            onClick={() => {
              setValue(`model.fields.${idx}.options.default`, undefined, {
                shouldDirty: true,
              });
            }}
            variant="ghost"
            size="icon"
          >
            <HiOutlineX />
          </Button>
        )}
      </div>
    );
  }

  if (type === 'uuid') {
    if (optionsValue?.genUuid) {
      return (
        <div className="flex items-center gap-1">
          <InputField disabled value="Random UUID v4" className="flex-1" />
          <Button
            title="Reset"
            onClick={() => {
              onOptionsChange({ ...optionsValue, genUuid: false });
            }}
            variant="ghost"
            size="icon"
          >
            <HiOutlineX />
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <InputFieldController
          control={control}
          placeholder="NULL"
          name={`model.fields.${idx}.options.default`}
          className="flex-1"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button title="Options" variant="ghost" size="icon">
              <HiDotsVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => {
                  onOptionsChange({
                    ...optionsValue,
                    genUuid: true,
                  });
                }}
              >
                Random UUID v4
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <Button
            title="Reset"
            onClick={() => {
              onOptionsChange({
                ...optionsValue,
                defaultToNow: false,
                updatedAt: false,
              });
            }}
            variant="ghost"
            size="icon"
          >
            <HiOutlineX />
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1">
        <InputFieldController
          placeholder="NULL"
          control={control}
          name={`model.fields.${idx}.options.default`}
          className="flex-1"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button title="Options" variant="ghost" size="icon">
              <HiDotsVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => {
                  onOptionsChange({
                    ...optionsValue,
                    defaultToNow: true,
                    updatedAt: false,
                  });
                }}
              >
                Now
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  onOptionsChange({
                    ...optionsValue,
                    defaultToNow: true,
                    updatedAt: true,
                  });
                }}
              >
                Last Updated At
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (type === 'enum' && optionsValue?.enumRef) {
    const fieldEnum = EnumUtils.byIdOrThrow(definition, optionsValue.enumRef);
    const enumValues = fieldEnum.values.map((v) => ({
      label: v.friendlyName,
      value: v.id,
    }));
    return (
      <div className="flex items-center space-x-1">
        <ComboboxField
          placeholder="NULL"
          value={optionsValue.defaultEnumValueRef ?? null}
          onChange={(value) => {
            onOptionsChange({
              ...optionsValue,
              defaultEnumValueRef: value ? value : undefined,
            });
          }}
          options={enumValues}
          className="flex-1"
        />
        {optionsValue.defaultEnumValueRef && (
          <Button
            title="Reset"
            onClick={() => {
              onOptionsChange({
                ...optionsValue,
                defaultEnumValueRef: '',
              });
            }}
            variant="ghost"
            size="icon"
          >
            <HiOutlineX />
          </Button>
        )}
      </div>
    );
  }

  return <div />;
}
