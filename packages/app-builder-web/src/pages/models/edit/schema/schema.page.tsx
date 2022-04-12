import { ModelConfig } from '@baseplate/app-builder-lib';
import { Alert, Button } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import CheckedInput from 'src/components/CheckedInput';
import { useStatus } from 'src/hooks/useStatus';
import { useModelForm } from '../hooks/useModelForm';

function ModelEditSchemaPage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit } = useModelForm({ setError });
  const { control, handleSubmit, watch } = form;

  const onSubmit = (data: ModelConfig): void => {
    onFormSubmit(data);
  };

  const localFields = watch(`model.fields`);
  const localFieldOptions = localFields.map((f) => ({
    label: f.name,
    value: f.name,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Alert.WithStatus status={status} />
      <CheckedInput.LabelledController
        label="Build Object Type?"
        control={control}
        name="schema.buildObjectType"
      />
      <CheckedArrayInput.LabelledController
        label="Exposed Fields"
        control={control}
        options={localFieldOptions}
        name="schema.exposedFields"
      />
      <CheckedInput.LabelledController
        label="Build Query?"
        control={control}
        name="schema.buildQuery"
      />
      <CheckedInput.LabelledController
        label="Build Mutations?"
        control={control}
        name="schema.buildMutations"
      />
      <Button type="submit">Save</Button>
    </form>
  );
}

export default ModelEditSchemaPage;
