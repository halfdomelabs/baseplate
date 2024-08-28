import {
  ModelConfig,
  ModelScalarFieldConfig,
  modelScalarFieldEntityType,
} from '@halfdomelabs/project-builder-lib';
import { Button, ButtonGroup, Dropdown } from '@halfdomelabs/ui-components';
import { useMemo } from 'react';
import { UseFieldArrayAppend, UseFormSetValue } from 'react-hook-form';
import { MdExpandMore } from 'react-icons/md';

import { useEditedModelConfig } from '../../../hooks/useEditedModelConfig';

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
}: ModelAddFieldButtonProps): JSX.Element {
  const fieldNames = useEditedModelConfig((model) => {
    return model.model.fields.map((f) => f.name);
  });
  const primaryKeyFieldLength = useEditedModelConfig((model) => {
    return model.model.primaryKeyFieldRefs.length;
  });
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
    autoField.fields.forEach(({ isPrimaryKey, ...field }) => {
      const fieldId = modelScalarFieldEntityType.generateNewId();
      if (!fieldNames.includes(field.name)) {
        appendField({
          id: fieldId,
          ...field,
        });
      }
      if (isPrimaryKey) {
        setValue('model.primaryKeyFieldRefs', [fieldId]);
      }
    });
  };
  return (
    <ButtonGroup className={className}>
      <ButtonGroup.Button
        variant="secondary"
        onClick={() =>
          appendField({
            id: modelScalarFieldEntityType.generateNewId(),
            name: '',
            type: 'string',
          })
        }
        size="sm"
      >
        Add Field
      </ButtonGroup.Button>
      <Dropdown>
        <Dropdown.Trigger disabled={availableAutoFields.length === 0} asChild>
          <ButtonGroup.Button variant="secondary" size="sm">
            <Button.Icon icon={MdExpandMore} />
          </ButtonGroup.Button>
        </Dropdown.Trigger>
        <Dropdown.Content>
          {availableAutoFields.map((field) => (
            <Dropdown.Item
              key={field.name}
              onClick={() => applyAutoField(field)}
            >
              {field.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown>
    </ButtonGroup>
  );
}
