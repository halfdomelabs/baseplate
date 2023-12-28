import {
  ModelConfig,
  modelScalarFieldType,
  randomUid,
} from '@halfdomelabs/project-builder-lib';
import { Button, ButtonGroup, Dropdown } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { useMemo } from 'react';
import {
  Control,
  FieldArrayWithId,
  useFieldArray,
  useWatch,
} from 'react-hook-form';
import { MdExpandMore } from 'react-icons/md';

import ModelFieldForm from './ModelFieldForm';
import { SortableList } from 'src/components/SortableList';

interface ModelFieldsFormProps {
  className?: string;
  control: Control<ModelConfig>;
}

interface AutoAddField {
  name: string;
  addField: () => void;
}

export function TableHeader({
  className,
  children,
  width,
}: {
  className?: string;
  children: React.ReactNode;
  width?: string;
}): JSX.Element {
  return (
    <th
      className={clsx('bg-white p-2 text-sm font-semibold', className)}
      style={{ width }}
    >
      {children}
    </th>
  );
}

export function ModelFieldsForm({
  className,
  control,
}: ModelFieldsFormProps): JSX.Element {
  const {
    fields: fieldFields,
    remove: removeField,
    append: appendField,
    move: sortFields,
  } = useFieldArray({
    control,
    name: 'model.fields',
  });

  const fields = useWatch({ control, name: 'model.fields' });

  const availableAutoFields = useMemo(() => {
    const autoFields: AutoAddField[] = [];
    if (!fields?.find((f) => f.name === 'id')) {
      autoFields.push({
        name: 'ID (uuid)',
        addField: () =>
          appendField({
            id: modelScalarFieldType.generateNewId(),
            uid: randomUid(),
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
        addField: () =>
          appendField([
            ...(hasUpdatedAt
              ? []
              : [
                  {
                    id: modelScalarFieldType.generateNewId(),
                    uid: randomUid(),
                    name: 'updatedAt',
                    type: 'dateTime' as const,
                    options: {
                      updatedAt: true,
                      defaultToNow: true,
                    },
                  },
                ]),
            ...(hasCreatedAt
              ? []
              : [
                  {
                    id: modelScalarFieldType.generateNewId(),
                    uid: randomUid(),
                    name: 'createdAt',
                    type: 'dateTime' as const,
                    options: {
                      defaultToNow: true,
                    },
                  },
                ]),
          ]),
      });
    }
    return autoFields;
  }, [fields, appendField]);

  const gridClassNames = clsx(
    'grid grid-cols-[repeat(3,1fr)_repeat(3,60px)_100px_80px] gap-2',
  );

  const fieldListItems = fieldFields.map((f: FieldArrayWithId, i: number) => ({
    id: f.id,
    element: (
      <ModelFieldForm
        className={gridClassNames}
        key={f.id}
        control={control}
        idx={i}
        onRemove={removeField}
      />
    ),
  }));

  return (
    <div className={clsx('space-y-4', className)}>
      {!fields.length ? undefined : (
        <div className="-m-2 flex w-full flex-col gap-2 bg-white p-2">
          <div
            className={clsx(
              gridClassNames,
              'sticky -top-4 z-10 bg-white py-2 text-sm font-semibold',
              // account for handle in sortable list
              'ml-12',
            )}
          >
            <div>Name</div>
            <div>Type</div>
            <div>Default Value</div>
            <div>Primary</div>
            <div>Optional</div>
            <div>Unique</div>
            <div className="sr-only">Tags</div>
            <div className="sr-only">Actions</div>
          </div>
          <SortableList listItems={fieldListItems} sortItems={sortFields} />
        </div>
      )}
      <div className="flex flex-row space-x-4">
        <ButtonGroup>
          <ButtonGroup.Button
            variant="secondary"
            onClick={() =>
              appendField({
                id: modelScalarFieldType.generateNewId(),
                uid: randomUid(),
                name: '',
                type: 'string',
              })
            }
          >
            Add Field
          </ButtonGroup.Button>
          <Dropdown>
            <Dropdown.Trigger
              disabled={availableAutoFields.length === 0}
              asChild
            >
              <ButtonGroup.Button variant="secondary">
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
      </div>
    </div>
  );
}
