import { AdminCrudSectionConfig } from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { Button, SelectInput, TextInput } from 'src/components';
import CollapsibleRow from 'src/components/CollapsibleRow';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

interface Props {
  className?: string;
  control: Control<AdminCrudSectionConfig>;
}

function FieldForm({
  idx,
  control,
  fieldOptions,
}: {
  idx: number;
  control: Control<AdminCrudSectionConfig>;
  fieldOptions: { label: string; value: string }[];
}): JSX.Element {
  return (
    <div className="space-y-4">
      <TextInput.LabelledController
        label="Label"
        control={control}
        name={`form.fields.${idx}.label`}
      />
      <SelectInput.LabelledController
        label="Field"
        control={control}
        name={`form.fields.${idx}.modelField`}
        options={fieldOptions}
      />
      <TextInput.LabelledController
        label="Validation (zod), e.g. z.string().min(1) (optional)"
        control={control}
        name={`form.fields.${idx}.validation`}
      />
    </div>
  );
}

function CrudFormFieldsForm({ className, control }: Props): JSX.Element {
  const modelName = useWatch({ control, name: 'modelName' });
  const { parsedProject } = useProjectConfig();
  const model = modelName ? parsedProject.getModelByName(modelName) : undefined;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'form.fields',
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
              {field.label} ({field.modelField})
            </div>
          }
          onRemove={() => remove(idx)}
          defaultOpen={!field.label}
        >
          <FieldForm
            key={field.id}
            idx={idx}
            control={control}
            fieldOptions={fieldOptions}
          />
        </CollapsibleRow>
      ))}
      <Button onClick={() => append({ type: 'text' })}>Add Column</Button>
    </div>
  );
}

export default CrudFormFieldsForm;
