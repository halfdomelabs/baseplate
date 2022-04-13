import { ModelConfig } from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Button, LinkButton } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  relationIdx: number;
}

function ModelRelationReferencesForm({
  className,
  formProps,
  relationIdx,
}: Props): JSX.Element {
  const { control, watch } = formProps;
  const { fields, remove, append } = useFieldArray({
    control,
    name: `model.relations.${relationIdx}.references`,
  });

  const foreignModelName = watch(`model.relations.${relationIdx}.modelName`);
  const localFields = watch(`model.fields`);
  const { parsedProject } = useProjectConfig();

  if (!foreignModelName) {
    return <div />;
  }
  const localFieldOptions = localFields.map((f) => ({
    label: f.name,
    value: f.name,
  }));

  const foreignFields = parsedProject.getModelByName(foreignModelName);
  const foreignFieldOptions = foreignFields.model.fields.map((f) => ({
    label: f.name,
    value: f.name,
  }));

  return (
    <div className={classNames('space-y-4', className)}>
      {fields.map((field, idx) => (
        <div key={field.id} className="flex flex-row space-x-4 justify-between">
          <ReactSelectInput.LabelledController
            className="w-full"
            control={control}
            name={`model.relations.${relationIdx}.references.${idx}.local`}
            options={localFieldOptions}
            label="Local Field"
          />
          <ReactSelectInput.LabelledController
            className="w-full"
            control={control}
            options={foreignFieldOptions}
            name={`model.relations.${relationIdx}.references.${idx}.foreign`}
            label="Foreign Field"
          />
          <LinkButton onClick={() => remove(idx)}>Remove</LinkButton>
        </div>
      ))}
      <Button onClick={() => append({})}>Add Reference</Button>
    </div>
  );
}

export default ModelRelationReferencesForm;
