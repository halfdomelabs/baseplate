import {
  ModelConfig,
  modelScalarFieldEntityType,
} from '@halfdomelabs/project-builder-lib';
import { Button, ButtonGroup, Dropdown } from '@halfdomelabs/ui-components';
import { useMemo } from 'react';
import { Control, UseFieldArrayAppend, useWatch } from 'react-hook-form';
import { MdExpandMore } from 'react-icons/md';

interface ModelAddFieldButtonProps {
  className?: string;
  control: Control<ModelConfig>;
  appendField: UseFieldArrayAppend<ModelConfig, 'model.fields'>;
}

interface AutoAddField {
  name: string;
  addField: () => void;
}

export function ModelAddFieldButton({
  className,
  control,
  appendField,
}: ModelAddFieldButtonProps): JSX.Element {
  const fields = useWatch({ control, name: 'model.fields' });

  const availableAutoFields = useMemo(() => {
    const autoFields: AutoAddField[] = [];
    if (!fields?.find((f) => f.name === 'id')) {
      autoFields.push({
        name: 'ID (uuid)',
        addField: () =>
          appendField({
            id: modelScalarFieldEntityType.generateNewId(),
            name: 'id',
            type: 'uuid',
            isId: true,
            options: {
              genUuid: true,
            },
          }),
      });
    }
    const hasCreatedAt = fields?.find((f) => f.name === 'createdAt');
    const hasUpdatedAt = fields?.find((f) => f.name === 'updatedAt');
    if (!hasCreatedAt || !hasUpdatedAt) {
      autoFields.push({
        name: 'Timestamps',
        addField: () => {
          if (!hasUpdatedAt) {
            appendField({
              id: modelScalarFieldEntityType.generateNewId(),
              name: 'updatedAt',
              type: 'dateTime',
              options: {
                updatedAt: true,
                defaultToNow: true,
              },
            });
          }
          if (!hasCreatedAt) {
            appendField({
              id: modelScalarFieldEntityType.generateNewId(),
              name: 'createdAt',
              type: 'dateTime',
              options: {
                defaultToNow: true,
              },
            });
          }
        },
      });
    }
    return autoFields;
  }, [fields, appendField]);

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
            <Dropdown.Item key={field.name} onClick={field.addField}>
              {field.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown>
    </ButtonGroup>
  );
}
