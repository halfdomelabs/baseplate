import {
  modelBaseSchema,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import { SectionList, SwitchField } from '@halfdomelabs/ui-components';

import { ServiceMethodFieldsSection } from './ServiceMethodFieldsSection';
import ServiceTransformersForm from './ServiceTransformersForm';
import { EditedModelContextProvider } from '../../hooks/useEditedModelConfig';
import { useModelForm } from '../../hooks/useModelForm';
import DataFormActionBar from '@src/pages/data/components/DataFormActionBar';
import { registerEntityTypeUrl } from '@src/services/entity-type';

registerEntityTypeUrl(
  modelTransformerEntityType,
  `/data/models/edit/{parentUid}`,
);

function ModelEditServicePage(): JSX.Element {
  const { form, onSubmit, originalModel, defaultValues } = useModelForm({
    schema: modelBaseSchema.omit({ name: true, feature: true }),
  });
  const { control, watch, getValues, setValue } = form;

  // TODO: Need to unset transformer options when reset

  return (
    <EditedModelContextProvider
      initialModel={defaultValues}
      getValues={getValues}
      watch={watch}
    >
      <form onSubmit={onSubmit} className="space-y-4 p-4">
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
          {originalModel && (
            <SectionList.Section>
              <SectionList.SectionHeader>
                <SectionList.SectionTitle>
                  Transformers
                </SectionList.SectionTitle>
                <SectionList.SectionDescription>
                  Transformers are used to operate on the data from the client
                  into the shape that the database ORM expects.
                </SectionList.SectionDescription>
              </SectionList.SectionHeader>
              <SectionList.SectionContent>
                {originalModel && (
                  <ServiceTransformersForm
                    formProps={form}
                    originalModel={originalModel}
                  />
                )}
              </SectionList.SectionContent>
            </SectionList.Section>
          )}
        </SectionList>
        <DataFormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditServicePage;
