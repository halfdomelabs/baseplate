import { ModelConfig, EnumUtils } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  ComboboxField,
  Dropdown,
  InputField,
} from '@halfdomelabs/ui-components';
import { Control, useController, useWatch } from 'react-hook-form';
import { HiDotsVertical, HiOutlineX } from 'react-icons/hi';

interface ModelFieldDefaultValueInputProps {
  control: Control<ModelConfig>;
  idx: number;
}

export function ModelFieldDefaultValueInput({
  control,
  idx,
}: ModelFieldDefaultValueInputProps): JSX.Element {
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

  if (['string', 'int', 'float', 'boolean'].includes(type)) {
    return (
      <InputField.Controller
        control={control}
        placeholder="NULL"
        name={`model.fields.${idx}.options.default`}
      />
    );
  }
  if (type === 'uuid') {
    if (optionsValue?.genUuid) {
      return (
        <div className="flex items-center space-x-1">
          <InputField disabled value="Random UUID v4" />
          <Button
            title="Reset"
            onClick={() => onOptionsChange({ ...optionsValue, genUuid: false })}
            variant="ghost"
            size="icon"
          >
            <Button.Icon icon={HiOutlineX} />
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1">
        <InputField.Controller
          control={control}
          placeholder="NULL"
          name={`model.fields.${idx}.options.default`}
        />
        <Dropdown>
          <Dropdown.Trigger asChild>
            <Button variant="ghost" size="icon">
              <Button.Icon icon={HiDotsVertical} />
            </Button>
          </Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Group>
              <Dropdown.Item
                onSelect={() =>
                  onOptionsChange({
                    ...optionsValue,
                    genUuid: true,
                  })
                }
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
        <div className="flex items-center space-x-1">
          <InputField disabled value={updatedAt ? 'Last Updated' : 'Now'} />
          <Button
            title="Reset"
            onClick={() =>
              onOptionsChange({
                ...optionsValue,
                defaultToNow: false,
                updatedAt: false,
              })
            }
            variant="ghost"
            size="icon"
          >
            <Button.Icon icon={HiOutlineX} />
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1">
        <InputField.Controller
          placeholder="NULL"
          control={control}
          name={`model.fields.${idx}.options.default`}
        />
        <Dropdown>
          <Dropdown.Trigger asChild>
            <Button variant="ghost" size="icon">
              <Button.Icon icon={HiDotsVertical} />
            </Button>
          </Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Group>
              <Dropdown.Item
                onSelect={() =>
                  onOptionsChange({
                    ...optionsValue,
                    defaultToNow: true,
                    updatedAt: false,
                  })
                }
              >
                Now
              </Dropdown.Item>
              <Dropdown.Item
                onSelect={() =>
                  onOptionsChange({
                    ...optionsValue,
                    defaultToNow: true,
                    updatedAt: true,
                  })
                }
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
    const fieldEnum = EnumUtils.byId(definition, optionsValue.enumType);
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
        />
        {optionsValue.defaultEnumValue && (
          <Button
            title="Reset"
            onClick={() =>
              onOptionsChange({
                ...optionsValue,
                defaultEnumValue: '',
              })
            }
            variant="ghost"
            size="icon"
          >
            <Button.Icon icon={HiOutlineX} />
          </Button>
        )}
      </div>
    );
  }

  return <div />;
}
