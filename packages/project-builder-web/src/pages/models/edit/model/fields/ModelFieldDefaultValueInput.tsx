import { EnumUtils, ModelConfig } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  ComboboxField,
  Dropdown,
  InputField,
  SelectField,
} from '@halfdomelabs/ui-components';
import {
  Control,
  UseFormSetValue,
  useController,
  useWatch,
} from 'react-hook-form';
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

  const defaultValue = useWatch({
    control,
    name: `model.fields.${idx}.options.default`,
  });

  if (type === 'boolean') {
    return (
      <div className="flex items-center space-x-1">
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
          <Button
            title="Reset"
            onClick={() => setValue(`model.fields.${idx}.options.default`, '')}
            variant="ghost"
            size="icon"
          >
            <Button.Icon icon={HiOutlineX} />
          </Button>
        )}
      </div>
    );
  }

  if (['string', 'int', 'float'].includes(type)) {
    return (
      <div className="flex items-center space-x-1">
        <InputField.Controller
          control={control}
          placeholder="NULL"
          name={`model.fields.${idx}.options.default`}
        />
        {defaultValue && (
          <Button
            title="Reset"
            onClick={() =>
              setValue(`model.fields.${idx}.options.default`, undefined)
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
