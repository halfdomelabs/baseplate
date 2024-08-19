import {
  FeatureComboboxField,
  hasDirtyFields,
} from '@halfdomelabs/project-builder-lib/web';
import { Button, SwitchField } from '@halfdomelabs/ui-components';

import { useEnumForm } from './hooks/useEnumForm';
import { TextInput } from '@src/components';

interface Props {
  onSubmit: () => void;
}

function AddEnumForm({ onSubmit }: Props): JSX.Element {
  const { form, submitHandler } = useEnumForm({
    onSubmitSuccess: onSubmit,
  });
  const { control, handleSubmit, formState } = form;

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <TextInput.LabelledController
        label="Name"
        control={control}
        name="name"
      />
      <FeatureComboboxField.Controller
        label="Feature"
        control={control}
        name="feature"
        placeholder="Select a feature"
        canCreate
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
