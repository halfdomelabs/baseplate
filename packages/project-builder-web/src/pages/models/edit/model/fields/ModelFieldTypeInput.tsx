import {
  ModelConfig,
  ScalarFieldType,
  SCALAR_FIELD_TYPES,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { ComboboxField } from '@halfdomelabs/ui-components';
import { Control, useController } from 'react-hook-form';


interface ModelFieldTypeInputProps {
  control: Control<ModelConfig>;
  idx: number;
}

interface TypeOption {
  label: string;
  value: string;
  description: string;
}

const scalarOptions: Record<ScalarFieldType, TypeOption> = {
  string: {
    label: 'String',
    value: 'string',
    description: 'Variable length text',
  },
  int: {
    label: 'Integer',
    value: 'int',
    description: 'Whole number',
  },
  float: {
    label: 'Float',
    value: 'float',
    description: 'Decimal number',
  },
  decimal: {
    label: 'Decimal',
    value: 'decimal',
    description: 'Precise decimal number',
  },
  boolean: {
    label: 'Boolean',
    value: 'boolean',
    description: 'True or false value',
  },
  json: {
    label: 'JSON',
    value: 'json',
    description: 'JSON data',
  },
  uuid: {
    label: 'UUID',
    value: 'uuid',
    description: 'Unique identifier',
  },
  dateTime: {
    label: 'DateTime',
    value: 'dateTime',
    description: 'Date and time',
  },
  date: {
    label: 'Date',
    value: 'date',
    description: 'Calendar date',
  },
  enum: {
    label: 'Enum',
    value: 'enum',
    description: 'List of values',
  },
};

export function ModelFieldTypeInput({
  control,
  idx,
}: ModelFieldTypeInputProps): JSX.Element {
  const { parsedProject } = useProjectDefinition();

  const enumOptions: TypeOption[] = parsedProject.getEnums().map((config) => ({
    label: config.name,
    value: `enum-${config.id}`,
    description: 'Enum type',
  }));

  const typeOptions = [
    ...SCALAR_FIELD_TYPES.filter((t) => t !== 'enum').map(
      (fieldType) => scalarOptions[fieldType],
    ),
    ...enumOptions,
  ];

  const {
    field: { value: typeValue, onChange: onTypeChange },
  } = useController({
    name: `model.fields.${idx}.type`,
    control,
  });

  const {
    field: { value: fieldOptions, onChange: onFieldOptionsChange },
  } = useController({
    name: `model.fields.${idx}.options`,
    control,
  });

  const handleChange = (value: string): void => {
    if (value.startsWith('enum-')) {
      const enumName = value.replace('enum-', '');
      onFieldOptionsChange({
        enumType: enumName,
      });
      onTypeChange('enum');
    } else {
      onTypeChange(value as ScalarFieldType);
    }
  };

  const enumType = fieldOptions?.enumType;

  return (
    <div className="space-y-2">
      <ComboboxField
        value={
          typeValue === 'enum' && enumType ? `enum-${enumType}` : typeValue
        }
        onChange={handleChange}
        options={typeOptions}
        renderItemLabel={(option) => (
          <div className="flex flex-col">
            <div>{option.label}</div>
            <div className="text-xs text-muted-foreground">
              {option.description}
            </div>
          </div>
        )}
      />
    </div>
  );
}
