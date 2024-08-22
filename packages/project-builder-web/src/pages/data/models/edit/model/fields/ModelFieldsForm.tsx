import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { clsx } from 'clsx';
import {
  Control,
  FieldArrayWithId,
  UseFormSetValue,
  useFieldArray,
  useWatch,
} from 'react-hook-form';

import { ModelAddFieldButton } from './ModelAddFieldButton';
import ModelFieldForm from './ModelFieldForm';
import { SortableList } from 'src/components/SortableList';

interface ModelFieldsFormProps {
  className?: string;
  control: Control<ModelConfig>;
  setValue: UseFormSetValue<ModelConfig>;
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
  setValue,
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

  const gridClassNames = clsx(
    'grid grid-cols-[repeat(2,1fr)_60px_1fr_repeat(2,60px)_1fr_80px] gap-3',
  );

  const fieldListItems = fieldFields.map((f: FieldArrayWithId, i: number) => ({
    id: f.id,
    element: (
      <ModelFieldForm
        className={gridClassNames}
        key={f.id}
        control={control}
        setValue={setValue}
        idx={i}
        onRemove={removeField}
      />
    ),
  }));

  return (
    <div className={clsx('space-y-4', className)}>
      {!fields.length ? (
        <p className="pt-4 text-style-muted">Add some fields to get started</p>
      ) : (
        <div className="-m-2 flex w-full flex-col gap-2 bg-white p-2">
          <div
            className={clsx(
              gridClassNames,
              'sticky -top-0 z-10 bg-white py-2 text-sm font-semibold',
              // account for handle in sortable list
              'pl-12',
            )}
          >
            <div>Name</div>
            <div>Type</div>
            <div>Optional</div>
            <div>Default Value</div>
            <div>Primary</div>
            <div>Unique</div>
            <div className="sr-only">Tags</div>
            <div className="sr-only">Actions</div>
          </div>
          <SortableList listItems={fieldListItems} sortItems={sortFields} />
        </div>
      )}
      <ModelAddFieldButton control={control} appendField={appendField} />
    </div>
  );
}
