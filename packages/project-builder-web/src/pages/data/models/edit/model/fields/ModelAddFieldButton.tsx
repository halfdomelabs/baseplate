import {
  ModelConfig,
  ModelScalarFieldConfig,
  modelScalarFieldEntityType,
} from '@halfdomelabs/project-builder-lib';
import { Button, ButtonGroup, Dropdown } from '@halfdomelabs/ui-components';
import { useMemo } from 'react';
import { UseFieldArrayAppend } from 'react-hook-form';
import { MdExpandMore } from 'react-icons/md';

import { useEditedModelConfig } from '../../../hooks/useEditedModelConfig';

interface ModelAddFieldButtonProps {
  className?: string;
  appendField: UseFieldArrayAppend<ModelConfig, 'model.fields'>;
}

interface AutoAddField {
  name: string;
  fields: Omit<ModelScalarFieldConfig, 'id'>[];
}

export function ModelAddFieldButton({
  className,
  appendField,
}: ModelAddFieldButtonProps): JSX.Element {
  const fieldNames = useEditedModelConfig((model) => {
    return model.model.fields.map((f) => f.name);
  });
  const availableAutoFields = useMemo(() => {
    const autoFields: AutoAddField[] = [];
    if (!fieldNames.includes('id')) {
      autoFields.push({
        name: 'ID (uuid)',
        fields: [
          {
            name: 'id',
            type: 'uuid',
            isId: true,
            options: {
              genUuid: true,
            },
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
  }, [fieldNames]);

  const applyAutoField = (autoField: AutoAddField): void => {
    autoField.fields.forEach((field) => {
      if (!fieldNames.includes(field.name)) {
        appendField({
          id: modelScalarFieldEntityType.generateNewId(),
          ...field,
        });
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
