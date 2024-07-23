import { EnumConfig } from '@halfdomelabs/project-builder-lib';
import {
  hasDirtyFields,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  ComboboxField,
  SwitchField,
} from '@halfdomelabs/ui-components';
import { UseFormReturn } from 'react-hook-form';

import { TextInput } from '@src/components';

interface Props {
  form: UseFormReturn<EnumConfig>;
  onSubmit: (config: EnumConfig) => void;
}

function AddEnumForm({ form, onSubmit }: Props): JSX.Element {
  const { parsedProject } = useProjectDefinition();
  const { control, handleSubmit, formState } = form;

  const featureOptions = (parsedProject.projectDefinition.features ?? []).map(
    (f) => ({
      label: f.name,
      value: f.id,
    }),
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <TextInput.LabelledController
        label="Name"
        control={control}
        name="name"
      />
      <ComboboxField.Controller
        label="Feature"
        control={control}
        name="feature"
        options={featureOptions}
        placeholder="Select a feature"
      />
      <SwitchField.Controller
        control={control}
        name="isExposed"
        label="Is Exposed?"
      />
      <div className="flex w-full justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button type="submit" disabled={!hasDirtyFields(formState)}>
          Add
        </Button>
      </div>
    </form>
  );
}

export default AddEnumForm;
