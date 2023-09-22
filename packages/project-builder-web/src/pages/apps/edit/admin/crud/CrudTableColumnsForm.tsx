import {
  adminCrudDisplayTypes,
  AdminCrudSectionConfig,
} from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { Button, SelectInput, TextInput } from 'src/components';
import CollapsibleRow from 'src/components/CollapsibleRow';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

export type AdminCrudTableConfig = Pick<
  AdminCrudSectionConfig,
  'table' | 'modelName'
>;

interface Props {
  className?: string;
  control: Control<AdminCrudTableConfig>;
}

function ColumnForm({
  idx,
  control,
  fieldOptions,
  localRelationOptions,
}: {
  idx: number;
  control: Control<AdminCrudTableConfig>;
  fieldOptions: { label: string; value: string }[];
  localRelationOptions: { label: string; value: string }[];
}): JSX.Element {
  const displayTypeOptions = adminCrudDisplayTypes.map((t) => ({
    label: t,
    value: t,
  }));
  const type = useWatch({ control, name: `table.columns.${idx}.display.type` });
  return (
    <div className="space-y-4">
      <SelectInput.LabelledController
        label="Type"
        control={control}
        options={displayTypeOptions}
        name={`table.columns.${idx}.display.type`}
      />
      <TextInput.LabelledController
        label="Label"
        control={control}
        name={`table.columns.${idx}.label`}
      />

      {type === 'text' && (
        <SelectInput.LabelledController
          label="Field"
          control={control}
          name={`table.columns.${idx}.display.modelField`}
          options={fieldOptions}
        />
      )}
      {type === 'foreign' && (
        <>
          <SelectInput.LabelledController
            label="Local Relation Name"
            control={control}
            name={`table.columns.${idx}.display.localRelationName`}
            options={localRelationOptions}
          />
          <TextInput.LabelledController
            label="Label Expression (e.g. name)"
            control={control}
            name={`table.columns.${idx}.display.labelExpression`}
          />
          <TextInput.LabelledController
            label="Value Expression (e.g. id)"
            control={control}
            name={`table.columns.${idx}.display.valueExpression`}
          />
        </>
      )}
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

  const localRelationOptions =
    model?.model.relations?.map((relation) => ({
      label: `${relation.name} (${relation.modelName})`,
      value: relation.name,
    })) ?? [];

  const fieldOptions =
    model?.model.fields.map((field) => ({
      label: field.name,
      value: field.name,
    })) ?? [];

  return (
    <div className={classNames('space-y-4', className)}>
      {fields.map((field, idx) => (
        <CollapsibleRow
          key={field.id}
          collapsedContents={
            <div>
              {field.label} ({field.display.type})
            </div>
          }
          onRemove={() => remove(idx)}
          defaultOpen={!field.label}
        >
          <ColumnForm
            key={field.id}
            idx={idx}
            control={control}
            fieldOptions={fieldOptions}
            localRelationOptions={localRelationOptions}
          />
        </CollapsibleRow>
      ))}
      <Button
        onClick={() =>
          append({ display: { type: 'text', modelField: '' }, label: '' })
        }
      >
        Add Column
      </Button>
    </div>
  );
}

export default CrudTableColumnsForm;
