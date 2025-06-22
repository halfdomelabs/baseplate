import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type {
  Control,
  FieldArrayWithId,
  UseFormSetValue,
} from 'react-hook-form';

import { clsx } from 'clsx';
import { useFieldArray } from 'react-hook-form';

import { SortableList } from '#src/components/index.js';

import { ModelAddFieldButton } from './model-add-field-button.js';
import ModelFieldForm from './model-field-form.js';

interface ModelFieldsFormProps {
  className?: string;
  control: Control<ModelConfigInput>;
  setValue: UseFormSetValue<ModelConfigInput>;
}

export function ModelFieldsForm({
  className,
  control,
  setValue,
}: ModelFieldsFormProps): React.JSX.Element {
  const {
    fields: fieldFields,
    remove: removeField,
    append: appendField,
    move: sortFields,
  } = useFieldArray({
    control,
    name: 'model.fields',
  });

  const gridClassNames =
    'grid grid-cols-[repeat(2,minmax(130px,1fr))_60px_minmax(130px,1fr)_minmax(100px,1fr)_80px] gap-3';

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
      {fieldFields.length === 0 ? (
        <p className="pt-4 text-style-muted">Add some fields to get started</p>
      ) : (
        <div className="flex w-full flex-col gap-2 bg-white">
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
            <div className="sr-only">Badges</div>
            <div className="sr-only">Actions</div>
          </div>
          <SortableList listItems={fieldListItems} sortItems={sortFields} />
        </div>
      )}
      <ModelAddFieldButton appendField={appendField} setValue={setValue} />
    </div>
  );
}
