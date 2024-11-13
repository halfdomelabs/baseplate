import {
  modelBaseSchema,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';
import { SectionList, SwitchField } from '@halfdomelabs/ui-components';

import { ServiceMethodFieldsSection } from './_components/service/ServiceMethodFieldsSection';
import { ServiceTransformersSection } from './_components/service/ServiceTransformersSection';
import { EditedModelContextProvider } from '../_hooks/useEditedModelConfig';
import { useModelForm } from '../_hooks/useModelForm';
import FormActionBar from '@src/components/FormActionBar';
import { registerEntityTypeUrl } from '@src/services/entity-type';

registerEntityTypeUrl(
  modelTransformerEntityType,
  `/data/models/edit/{parentUid}`,
);

function ModelEditServicePage(): JSX.Element {
  const { form, onSubmit, defaultValues } = useModelForm({
    schema: modelBaseSchema.omit({ name: true, feature: true }),
  });
  const { control, watch, getValues, setValue } = form;

  useBlockUnsavedChangesNavigate(form.formState, {
    reset: form.reset,
    onSubmit,
  });

  return (
    <EditedModelContextProvider
      initialModel={defaultValues}
      getValues={getValues}
      watch={watch}
    >
      <form onSubmit={onSubmit} className="max-w-5xl space-y-4 p-4">
        <SectionList>
          <SectionList.Section>
            <SectionList.SectionHeader>
              <SectionList.SectionTitle>Methods</SectionList.SectionTitle>
              <SectionList.SectionDescription>
                Enable or disable which service methods will be generated
              </SectionList.SectionDescription>
            </SectionList.SectionHeader>
            <SectionList.SectionContent className="flex gap-8">
              <SwitchField.Controller
                label="Create"
                name="service.create.enabled"
                control={control}
              />
              <SwitchField.Controller
                label="Update"
                name="service.update.enabled"
                control={control}
              />
              <SwitchField.Controller
                label="Delete"
                name="service.delete.enabled"
                control={control}
              />
            </SectionList.SectionContent>
          </SectionList.Section>
          <ServiceMethodFieldsSection control={control} setValue={setValue} />
          <ServiceTransformersSection formProps={form} />
        </SectionList>
        <FormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditServicePage;
