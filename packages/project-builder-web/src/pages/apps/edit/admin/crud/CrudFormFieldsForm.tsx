import {
  AdminCrudSectionConfig,
  adminCrudInputTypes,
  FileTransformerConfig,
} from '@baseplate/project-builder-lib';
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
  localRelationOptions,
  enumFieldOptions,
  fileTransformerOptions,
}: {
  idx: number;
  control: Control<AdminCrudSectionConfig>;
  enumFieldOptions: { label: string; value: string }[];
  fieldOptions: { label: string; value: string }[];
  localRelationOptions: { label: string; value: string }[];
  fileTransformerOptions: { label: string; value: string }[];
}): JSX.Element {
  const fieldTypeOptions = adminCrudInputTypes.map((t) => ({
    label: t,
    value: t,
  }));
  const type = useWatch({
    control,
    name: `form.fields.${idx}.type`,
  });

  return (
    <div className="space-y-4">
      <SelectInput.LabelledController
        label="Type"
        control={control}
        options={fieldTypeOptions}
        name={`form.fields.${idx}.type`}
      />
      <TextInput.LabelledController
        label="Label"
        control={control}
        name={`form.fields.${idx}.label`}
      />
      {type === 'enum' && (
        <SelectInput.LabelledController
          label="Enum Field"
          control={control}
          name={`form.fields.${idx}.modelField`}
          options={enumFieldOptions}
        />
      )}
      {type === 'foreign' && (
        <>
          <SelectInput.LabelledController
            label="Local Relation Name"
            control={control}
            name={`form.fields.${idx}.localRelationName`}
            options={localRelationOptions}
          />
          <TextInput.LabelledController
            label="Label Expression (e.g. name)"
            control={control}
            name={`form.fields.${idx}.labelExpression`}
          />
          <TextInput.LabelledController
            label="Value Expression (e.g. id)"
            control={control}
            name={`form.fields.${idx}.valueExpression`}
          />
          <TextInput.LabelledController
            label="Default Label (optional)"
            control={control}
            name={`form.fields.${idx}.defaultLabel`}
          />
        </>
      )}
      {type === 'file' && (
        <SelectInput.LabelledController
          label="File Transformer Name"
          control={control}
          name={`form.fields.${idx}.modelRelation`}
          options={fileTransformerOptions}
        />
      )}
      {type === 'text' && (
        <>
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
        </>
      )}
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

  const localRelationOptions =
    model?.model.relations?.map((relation) => ({
      label: `${relation.name} (${relation.modelName})`,
      value: relation.name,
    })) || [];

  const fileTransformerOptions =
    model?.service?.transformers
      ?.filter((t): t is FileTransformerConfig => t.type === 'file')
      .map((transformer) => ({
        label: transformer.name,
        value: transformer.name,
      })) || [];

  const enumFieldOptions =
    model?.model.fields
      .filter((f) => f.type === 'enum')
      .map((field) => ({
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
              {field.label} ({field.type})
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
            localRelationOptions={localRelationOptions}
            enumFieldOptions={enumFieldOptions}
            fileTransformerOptions={fileTransformerOptions}
          />
        </CollapsibleRow>
      ))}
      <Button onClick={() => append({ type: 'text' })}>Add Field</Button>
    </div>
  );
}

export default CrudFormFieldsForm;
