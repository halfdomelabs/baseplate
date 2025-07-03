import type React from 'react';

import { modelTransformerEntityType } from '@baseplate-dev/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { createFileRoute } from '@tanstack/react-router';

import { registerEntityTypeUrl } from '#src/services/entity-type.js';

import { EditedModelContextProvider } from '../-hooks/use-edited-model-config.js';
import { useModelForm } from '../-hooks/use-model-form.js';
import { ServiceMethodFieldsSection } from './-components/service/service-method-fields-section.js';
import { ServiceTransformersSection } from './-components/service/service-transformers-section.js';

registerEntityTypeUrl(
  modelTransformerEntityType,
  `/data/models/edit/{parentKey}`,
);

export const Route = createFileRoute('/data/models/edit/$key/service')({
  component: ModelEditServicePage,
  beforeLoad: () => ({
    getTitle: () => 'Service',
  }),
});

function ModelEditServicePage(): React.JSX.Element {
  const { key } = Route.useParams();
  const { form, onSubmit, defaultValues } = useModelForm({
    omit: ['name', 'featureRef'],
    modelKey: key,
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
              <SwitchFieldController
                label="Create"
                name="service.create.enabled"
                control={control}
              />
              <SwitchFieldController
                label="Update"
                name="service.update.enabled"
                control={control}
              />
              <SwitchFieldController
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
