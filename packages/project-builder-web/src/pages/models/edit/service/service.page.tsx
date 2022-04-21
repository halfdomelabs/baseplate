import { ModelConfig } from '@baseplate/project-builder-lib';
import { Alert, Button } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import CheckedInput from 'src/components/CheckedInput';
import { useStatus } from 'src/hooks/useStatus';
import { useModelForm } from '../hooks/useModelForm';
import ServiceTransformersForm from './ServiceTransformersForm';

function ModelEditServicePage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit, originalModel } = useModelForm({ setError });
  const { control, handleSubmit, watch } = form;

  const shouldBuild = watch('service.build');

  const onSubmit = (data: ModelConfig): void => {
    if (!data.service?.build) {
      // clean any service data on save to avoid unused references
      onFormSubmit({
        ...data,
        service: {
          build: false,
        },
      });
    } else {
      onFormSubmit(data);
    }
  };

  const localFields = watch(`model.fields`);
  const localFieldOptions = localFields.map((f) => ({
    label: f.name,
    value: f.name,
  }));

  const transformers = watch(`service.transformers`);
  const transformerOptions = transformers?.map((f) => ({
    label: f.name,
    value: f.name,
  }));

  // TODO: Need to unset transformer options when reset

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Alert.WithStatus status={status} />
      <CheckedInput.LabelledController
        label="Build controller?"
        control={control}
        name="service.build"
      />
      {shouldBuild && (
        <>
          <CheckedArrayInput.LabelledController
            label="Createable Fields"
            control={control}
            options={localFieldOptions}
            name="service.create.fields"
          />
          {!!transformerOptions?.length && (
            <CheckedArrayInput.LabelledController
              label="Create Transformers"
              control={control}
              options={transformerOptions}
              name="service.create.transformerNames"
            />
          )}
          <CheckedArrayInput.LabelledController
            label="Updateable Fields"
            control={control}
            options={localFieldOptions}
            name="service.update.fields"
          />
          {!!transformerOptions?.length && (
            <CheckedArrayInput.LabelledController
              label="Update Transformers"
              control={control}
              options={transformerOptions}
              name="service.update.transformerNames"
            />
          )}
          {originalModel && (
            <ServiceTransformersForm
              formProps={form}
              originalModel={originalModel}
            />
          )}
        </>
      )}
      <Button type="submit">Save</Button>
    </form>
  );
}

export default ModelEditServicePage;
