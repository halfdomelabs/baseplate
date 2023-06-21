import { ModelConfig, randomUid } from '@halfdomelabs/project-builder-lib';
import { ButtonGroup, Dropdown } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { useMemo } from 'react';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
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

  return (
    <div className={clsx('space-y-4', className)}>
      {!fields.length ? undefined : (
        <table className="-m-2 w-full min-w-[720px] table-fixed border-separate border-spacing-2 bg-white">
          <thead className="sticky -top-4 z-10 bg-white">
            <tr className="text-left">
              <TableHeader width="20%">Name</TableHeader>
              <TableHeader width="20%">Type</TableHeader>
              <TableHeader width="20%">Default Value</TableHeader>
              <TableHeader width="10%">Primary</TableHeader>
              <TableHeader width="10%">Optional</TableHeader>
              <TableHeader width="10%">Unique</TableHeader>
              <TableHeader width="10%" className="sr-only">
                Actions
              </TableHeader>
            </tr>
          </thead>
          <tbody>
            {fieldFields.map((field, i) => (
              <ModelFieldForm
                key={field.id}
                control={control}
                idx={i}
                onRemove={removeField}
                fixReferences={fixReferences}
                originalModel={originalModel}
              />
            ))}
          </tbody>
        </table>
      )}
      <div className="flex flex-row space-x-4">
        <ButtonGroup>
          <ButtonGroup.Button
            variant="secondary"
            onClick={() =>
              appendField({
                uid: randomUid(),
                name: '',
                type: 'string',
              })
            }
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
