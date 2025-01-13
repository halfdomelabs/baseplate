import type {
  ModelConfig,
  ScalarFieldType,
} from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { SCALAR_FIELD_TYPES } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { ComboboxField } from '@halfdomelabs/ui-components';
import { useController } from 'react-hook-form';

import type { ScalarFieldTypeOption } from '../../../../_constants';

import { SCALAR_FIELD_TYPE_OPTIONS } from '../../../../_constants';

interface ModelFieldTypeInputProps {
  control: Control<ModelConfig>;
  idx: number;
}

export function ModelFieldTypeInput({
  control,
  idx,
}: ModelFieldTypeInputProps): React.JSX.Element {
  const { parsedProject } = useProjectDefinition();

  const enumOptions: ScalarFieldTypeOption[] = parsedProject
    .getEnums()
    .map((config) => ({
      label: config.name,
      value: `enum-${config.id}`,
      description: 'Enum type',
    }));

  const typeOptions = [
    ...SCALAR_FIELD_TYPES.filter((t) => t !== 'enum').map(
      (fieldType) => SCALAR_FIELD_TYPE_OPTIONS[fieldType],
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

  const handleChange = (value: string | null): void => {
    if (value?.startsWith('enum-')) {
      const enumRef = value.replace('enum-', '');
      onFieldOptionsChange({
        enumRef,
      });
      onTypeChange('enum');
    } else {
      onTypeChange(value as ScalarFieldType);
    }
  };

  const enumRef = fieldOptions?.enumRef;

  return (
    <div className="space-y-2">
      <ComboboxField
        value={typeValue === 'enum' && enumRef ? `enum-${enumRef}` : typeValue}
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
