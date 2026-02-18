import type {
  ModelConfigInput,
  ModelScalarFieldConfigInput,
} from '@baseplate-dev/project-builder-lib';
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

type UuidOptions = Extract<
  ModelScalarFieldConfigInput,
  { type: 'uuid' }
>['options'];
type DateTimeOptions = Extract<
  ModelScalarFieldConfigInput,
  { type: 'dateTime' }
>['options'];
type EnumOptions = Extract<
  ModelScalarFieldConfigInput,
  { type: 'enum' }
>['options'];

interface DefaultValueInputProps {
  control: Control<ModelConfigInput>;
  setValue: UseFormSetValue<ModelConfigInput>;
  idx: number;
}

export type ModelFieldDefaultValueInputProps = DefaultValueInputProps;

function BooleanDefaultValueInput({
  control,
  setValue,
  idx,
}: DefaultValueInputProps): React.JSX.Element {
  const defaultValue = useWatch({
    control,
    name: `model.fields.${idx}.options.default`,
  });

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

function StringDefaultValueInput({
  control,
  setValue,
  idx,
}: DefaultValueInputProps): React.JSX.Element {
  const defaultValue = useWatch({
    control,
    name: `model.fields.${idx}.options.default`,
  });

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

function UuidDefaultValueInput({
  control,
  idx,
}: DefaultValueInputProps): React.JSX.Element {
  const {
    field: { value: rawOptions, onChange: onOptionsChange },
  } = useController({
    name: `model.fields.${idx}.options`,
    control,
  });

  const optionsValue = rawOptions as UuidOptions | undefined;

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

function DateTimeDefaultValueInput({
  control,
  idx,
}: DefaultValueInputProps): React.JSX.Element {
  const {
    field: { value: rawOptions, onChange: onOptionsChange },
  } = useController({
    name: `model.fields.${idx}.options`,
    control,
  });

  const optionsValue = rawOptions as DateTimeOptions | undefined;
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
      <InputField placeholder="NULL" disabled className="flex-1" />
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

function EnumDefaultValueInput({
  control,
  idx,
}: DefaultValueInputProps): React.JSX.Element {
  const { definition } = useProjectDefinition();
  const {
    field: { value: rawOptions, onChange: onOptionsChange },
  } = useController({
    name: `model.fields.${idx}.options`,
    control,
  });

  const optionsValue = rawOptions as EnumOptions | undefined;

  if (!optionsValue?.enumRef) {
    return <div />;
  }

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

export function ModelFieldDefaultValueInput(
  props: ModelFieldDefaultValueInputProps,
): React.JSX.Element | null {
  const type = useWatch({
    control: props.control,
    name: `model.fields.${props.idx}.type`,
  });

  switch (type) {
    case 'boolean': {
      return <BooleanDefaultValueInput {...props} />;
    }
    case 'string':
    case 'int':
    case 'float': {
      return <StringDefaultValueInput {...props} />;
    }
    case 'uuid': {
      return <UuidDefaultValueInput {...props} />;
    }
    case 'dateTime':
    case 'date': {
      return <DateTimeDefaultValueInput {...props} />;
    }
    case 'enum': {
      return <EnumDefaultValueInput {...props} />;
    }
    case 'decimal':
    case 'json': {
      return null;
    }
    default: {
      const exhaustiveCheck: never = type;
      void exhaustiveCheck;
      return null;
    }
  }
}
