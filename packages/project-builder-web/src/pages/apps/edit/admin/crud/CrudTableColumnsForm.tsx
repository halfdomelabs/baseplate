import {
  AdminCrudSectionConfig,
  adminCrudTableColumnSchema,
} from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button, SelectInput, TextInput } from 'src/components';
import CollapsibleRow from 'src/components/CollapsibleRow';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

interface Props {
  className?: string;
  control: Control<AdminCrudSectionConfig>;
}

function ColumnForm({
  idx,
  field,
  control,
  fieldOptions,
}: {
  idx: number;
  field: z.infer<typeof adminCrudTableColumnSchema>;
  control: Control<AdminCrudSectionConfig>;
  fieldOptions: { label: string; value: string }[];
}): JSX.Element {
  return (
    <div className="space-y-4">
      <SelectInput.LabelledController
        label="Field"
        control={control}
        name={`table.columns.${idx}.renderer.field`}
        options={fieldOptions}
      />
      <TextInput.LabelledController
        label="Label"
        control={control}
        name={`table.columns.${idx}.label`}
      />
    </div>
  );
}

function CrudTableColumnsForm({ className, control }: Props): JSX.Element {
  const modelName = useWatch({ control, name: 'modelName' });
  const { parsedProject } = useProjectConfig();
  const model = modelName ? parsedProject.getModelByName(modelName) : undefined;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'table.columns',
  });

  const fieldOptions =
    model?.model.fields.map((field) => ({
      label: field.name,
      value: field.name,
    })) || [];

  return (
    <div className={classNames('space-y-4', className)}>
      {fields.map((field, idx) => (
        <CollapsibleRow
          key={field.id}
          collapsedContents={
            <div>
              {field.label} ({field.renderer.type})
            </div>
          }
          onRemove={() => remove(idx)}
          defaultOpen={!field.label}
        >
          <ColumnForm
            key={field.id}
            idx={idx}
            field={field}
            control={control}
            fieldOptions={fieldOptions}
          />
        </CollapsibleRow>
      ))}
      <Button onClick={() => append({ renderer: { type: 'text', field: '' } })}>
        Add Column
      </Button>
    </div>
  );
}

export default CrudTableColumnsForm;
