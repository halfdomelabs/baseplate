import type {
  ModelConfig,
  ModelScalarFieldConfig,
} from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { UseFieldArrayAppend, UseFormSetValue } from 'react-hook-form';

import { modelScalarFieldEntityType } from '@halfdomelabs/project-builder-lib';
import { ButtonGroup, Dropdown } from '@halfdomelabs/ui-components';
import { useMemo } from 'react';
import { MdExpandMore } from 'react-icons/md';

import { useEditedModelConfig } from '../../../../_hooks/useEditedModelConfig';

interface ModelAddFieldButtonProps {
  className?: string;
  appendField: UseFieldArrayAppend<ModelConfig, 'model.fields'>;
  setValue: UseFormSetValue<ModelConfig>;
}

interface AutoAddField {
  name: string;
  fields: (Omit<ModelScalarFieldConfig, 'id'> & { isPrimaryKey?: boolean })[];
}

export function ModelAddFieldButton({
  className,
  appendField,
  setValue,
}: ModelAddFieldButtonProps): React.JSX.Element {
  const fieldNames = useEditedModelConfig((model) =>
    model.model.fields.map((f) => f.name),
  );
  const primaryKeyFieldLength = useEditedModelConfig(
    (model) => model.model.primaryKeyFieldRefs.length,
  );
  const availableAutoFields = useMemo(() => {
    const autoFields: AutoAddField[] = [];
    if (!primaryKeyFieldLength) {
      autoFields.push({
        name: 'ID (uuid)',
        fields: [
          {
            name: 'id',
            type: 'uuid',
            options: {
              genUuid: true,
            },
            isPrimaryKey: true,
          },
        ],
      });
    }
    const hasCreatedAt = fieldNames.includes('createdAt');
    const hasUpdatedAt = fieldNames.includes('updatedAt');
    if (!hasCreatedAt || !hasUpdatedAt) {
      autoFields.push({
        name: 'Timestamps',
        fields: [
          {
            name: 'createdAt',
            type: 'dateTime',
            options: {
              defaultToNow: true,
            },
          },
          {
            name: 'updatedAt',
            type: 'dateTime',
            options: {
              updatedAt: true,
              defaultToNow: true,
            },
          },
        ],
      });
    }
    return autoFields;
  }, [fieldNames, primaryKeyFieldLength]);

  const applyAutoField = (autoField: AutoAddField): void => {
    for (const { isPrimaryKey, ...field } of autoField.fields) {
      const fieldId = modelScalarFieldEntityType.generateNewId();
      if (!fieldNames.includes(field.name)) {
        appendField({
          id: fieldId,
          ...field,
        });
      }
      if (isPrimaryKey) {
        setValue('model.primaryKeyFieldRefs', [fieldId], { shouldDirty: true });
      }
    }
  };
  return (
    <ButtonGroup className={className}>
      <ButtonGroup.Button
        variant="secondary"
        onClick={() => {
          appendField({
            id: modelScalarFieldEntityType.generateNewId(),
            name: '',
            type: 'string',
          });
        }}
        size="sm"
      >
        Add Field
      </ButtonGroup.Button>
      <Dropdown>
        <Dropdown.Trigger disabled={availableAutoFields.length === 0} asChild>
          <ButtonGroup.Button variant="secondary" size="sm">
            <MdExpandMore />
          </ButtonGroup.Button>
        </Dropdown.Trigger>
        <Dropdown.Content>
          {availableAutoFields.map((field) => (
            <Dropdown.Item
              key={field.name}
              onClick={() => {
                applyAutoField(field);
              }}
            >
              {field.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown>
    </ButtonGroup>
  );
}
