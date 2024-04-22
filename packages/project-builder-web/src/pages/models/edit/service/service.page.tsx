import {
  ModelConfig,
  ModelTransformerUtils,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';

import ServiceTransformersForm from './ServiceTransformersForm';
import ModelFormActionBar from '../ModelFormActionBar';
import { EditedModelContextProvider } from '../hooks/useEditedModelConfig';
import { useModelForm } from '../hooks/useModelForm';
import { useProjectDefinition } from '@src/hooks/useProjectDefinition';
import { registerEntityTypeUrl } from '@src/services/entity-type';
import { Alert } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import CheckedInput from 'src/components/CheckedInput';
import { useStatus } from 'src/hooks/useStatus';

registerEntityTypeUrl(modelTransformerEntityType, `/models/edit/{parentUid}`);

function ModelEditServicePage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit, originalModel, defaultValues } = useModelForm({
    setError,
  });
  const { control, handleSubmit, watch, getValues } = form;
  const { definitionContainer } = useProjectDefinition();
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
    value: f.id,
  }));

  const transformers = watch(`service.transformers`);
  const transformerOptions = transformers?.map((f) => ({
    label: ModelTransformerUtils.getTransformName(definitionContainer, f),
    value: f.id,
  }));

  // TODO: Need to unset transformer options when reset

  return (
    <EditedModelContextProvider
      initialModel={defaultValues}
      getValues={getValues}
      watch={watch}
    >
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
            <CheckedInput.LabelledController
              label="Disable Delete?"
              control={control}
              name="service.delete.disabled"
            />
            {originalModel && (
              <ServiceTransformersForm
                formProps={form}
                originalModel={originalModel}
              />
            )}
          </>
        )}
        <ModelFormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditServicePage;
