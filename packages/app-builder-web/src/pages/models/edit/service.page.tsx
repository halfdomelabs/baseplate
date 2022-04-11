import { Alert, Button } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import { useStatus } from 'src/hooks/useStatus';
import { useModelForm } from './hooks/useModelForm';

function ModelEditServicePage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit } = useModelForm({ setError });
  const { control, handleSubmit } = form;
  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <Alert.WithStatus status={status} />
      <CheckedInput.LabelledController
        label="Build controller?"
        control={control}
        name="service.build"
      />
      <Button type="submit">Save</Button>
    </form>
  );
}

export default ModelEditServicePage;
