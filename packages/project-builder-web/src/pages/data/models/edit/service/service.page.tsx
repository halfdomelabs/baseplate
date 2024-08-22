import {
  ModelTransformerUtils,
  modelBaseSchema,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';

import ServiceTransformersForm from './ServiceTransformersForm';
import { EditedModelContextProvider } from '../../hooks/useEditedModelConfig';
import { useModelForm } from '../../hooks/useModelForm';
import DataFormActionBar from '@src/pages/data/components/DataFormActionBar';
import { registerEntityTypeUrl } from '@src/services/entity-type';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import CheckedInput from 'src/components/CheckedInput';

registerEntityTypeUrl(
  modelTransformerEntityType,
  `/data/models/edit/{parentUid}`,
);

function ModelEditServicePage(): JSX.Element {
  const { form, onSubmit, originalModel, defaultValues } = useModelForm({
    schema: modelBaseSchema.omit({ name: true, feature: true }),
  });
  const { control, watch, getValues } = form;
  const { definitionContainer, pluginContainer } = useProjectDefinition();
  const shouldBuild = watch('service.build');

  const localFields = watch(`model.fields`);
  const localFieldOptions = localFields.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  const transformers = watch(`service.transformers`);
  const transformerOptions = transformers?.map((f) => ({
    label: ModelTransformerUtils.getTransformName(
      definitionContainer,
      f,
      pluginContainer,
    ),
    value: f.id ?? '',
  }));

  // TODO: Need to unset transformer options when reset

  return (
    <EditedModelContextProvider
      initialModel={defaultValues}
      getValues={getValues}
      watch={watch}
    >
      <form onSubmit={onSubmit} className="space-y-4 p-4">
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
        <DataFormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditServicePage;
