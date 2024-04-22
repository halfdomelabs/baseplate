import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';

import { Button, LinkButton } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';

interface Props {
  className?: string;
  relationIdx: number;
  control: Control<ModelConfig>;
}

function ModelRelationReferencesForm({
  className,
  relationIdx,
  control,
}: Props): JSX.Element {
  const { fields, remove, append } = useFieldArray({
    control,
    name: `model.relations.${relationIdx}.references`,
  });

  const foreignModelName = useWatch({
    control,
    name: `model.relations.${relationIdx}.modelName`,
  });
  const localFields = useWatch({ control, name: `model.fields` });
  const { parsedProject } = useProjectDefinition();

  if (!foreignModelName) {
    return <div />;
  }
  const localFieldOptions = localFields.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  const foreignFields = parsedProject.getModelById(foreignModelName);
  const foreignFieldOptions = foreignFields.model.fields.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  return (
    <div className={classNames('space-y-4', className)}>
      {fields.map((field, idx) => (
        <div key={field.id} className="flex flex-row justify-between space-x-4">
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
      <Button
        onClick={() =>
          append({
            foreign: '',
            local: '',
          })
        }
      >
        Add Reference
      </Button>
    </div>
  );
}

export default ModelRelationReferencesForm;
