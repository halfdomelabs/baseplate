import { ModelConfig, randomUid } from '@halfdomelabs/project-builder-lib';
import { ButtonGroup, Dropdown } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { useMemo } from 'react';
import {
  Control,
  FieldArrayWithId,
  useFieldArray,
  useWatch,
} from 'react-hook-form';
import { SortableList } from 'src/components/SortableList';
import ModelFieldForm from './ModelFieldForm';

interface ModelFieldsFormProps {
  className?: string;
  control: Control<ModelConfig>;
  fixReferences: () => void;
  originalModel?: ModelConfig;
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
  fixReferences,
  originalModel,
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
    'grid grid-cols-[repeat(3,1fr)_repeat(3,60px)_100px_80px] gap-2'
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
        fixReferences={fixReferences}
        originalModel={originalModel}
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
              'sticky -top-4 z-10 bg-white py-2 text-sm font-semibold'
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
            onClick={() => {
              appendField({
                uid: randomUid(),
                name: '',
                type: 'string',
              });
            }}
          >
            Add Field
          </ButtonGroup.Button>
          <ButtonGroup.Dropdown
            variant="secondary"
            disabled={availableAutoFields.length === 0}
          >
            {availableAutoFields.map((field) => (
              <Dropdown.ButtonItem key={field.name} onClick={field.addField}>
                {field.name}
              </Dropdown.ButtonItem>
            ))}
          </ButtonGroup.Dropdown>
        </ButtonGroup>
      </div>
    </div>
  );
}
