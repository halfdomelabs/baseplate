import type React from 'react';

import {
  modelBaseSchema,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';
import {
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchField,
} from '@halfdomelabs/ui-components';

import { FormActionBar } from '@src/components';
import { registerEntityTypeUrl } from '@src/services/entity-type';

import { EditedModelContextProvider } from '../../_hooks/useEditedModelConfig';
import { useModelForm } from '../../_hooks/useModelForm';
import { ServiceMethodFieldsSection } from './_components/service/ServiceMethodFieldsSection';
import { ServiceTransformersSection } from './_components/service/ServiceTransformersSection';

registerEntityTypeUrl(
  modelTransformerEntityType,
  `/data/models/edit/{parentUid}`,
);

const formSchema = modelBaseSchema.omit({ name: true, featureRef: true });

function ModelEditServicePage(): React.JSX.Element {
  const { form, onSubmit, defaultValues } = useModelForm({
    schema: formSchema,
  });
  const { control, watch, getValues, setValue, reset } = form;

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <EditedModelContextProvider
      initialModel={defaultValues}
      getValues={getValues}
      watch={watch}
    >
      <form onSubmit={onSubmit} className="w-full max-w-7xl space-y-4 p-4">
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>Methods</SectionListSectionTitle>
              <SectionListSectionDescription>
                Enable or disable which service methods will be generated
              </SectionListSectionDescription>
            </SectionListSectionHeader>
            <SectionListSectionContent className="flex gap-8">
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
            </SectionListSectionContent>
          </SectionListSection>
          <ServiceMethodFieldsSection control={control} setValue={setValue} />
          <ServiceTransformersSection formProps={form} />
        </SectionList>
        <FormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditServicePage;
