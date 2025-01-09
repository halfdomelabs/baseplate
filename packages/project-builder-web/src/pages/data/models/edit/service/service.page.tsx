import type React from 'react';

import {
  modelBaseSchema,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';
import { SectionList, SwitchField } from '@halfdomelabs/ui-components';

import FormActionBar from '@src/components/FormActionBar';
import { registerEntityTypeUrl } from '@src/services/entity-type';

import { EditedModelContextProvider } from '../../hooks/useEditedModelConfig';
import { useModelForm } from '../../hooks/useModelForm';
import { ServiceMethodFieldsSection } from './ServiceMethodFieldsSection';
import { ServiceTransformersSection } from './ServiceTransformersSection';

registerEntityTypeUrl(
  modelTransformerEntityType,
  `/data/models/edit/{parentUid}`,
);

function ModelEditServicePage(): React.JSX.Element {
  const { form, onSubmit, defaultValues } = useModelForm({
    schema: modelBaseSchema.omit({ name: true, featureRef: true }),
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
      <form onSubmit={onSubmit} className="w-full max-w-7xl space-y-4 p-4">
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
