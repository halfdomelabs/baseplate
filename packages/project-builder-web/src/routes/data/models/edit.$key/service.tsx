import type React from 'react';

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

import { useModelForm } from '../-hooks/use-model-form.js';
import { OriginalModelProvider } from '../-hooks/use-original-model.js';
import { ServiceMethodAuthSection } from './-components/service/service-method-auth-section.js';
import { ServiceMethodFieldsSection } from './-components/service/service-method-fields-section.js';
import { ServiceTransformersSection } from './-components/service/service-transformers-section.js';

export const Route = createFileRoute('/data/models/edit/$key/service')({
  component: ModelEditServicePage,
  beforeLoad: () => ({
    getTitle: () => 'Service',
  }),
});

function ModelEditServicePage(): React.JSX.Element {
  const { key } = Route.useParams();
  const { form, onSubmit, originalModel } = useModelForm({
    omit: ['name', 'featureRef'],
    modelKey: key,
  });
  const { control, setValue, reset } = form;

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <OriginalModelProvider model={originalModel}>
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
          <ServiceMethodAuthSection control={control} setValue={setValue} />
          <ServiceMethodFieldsSection control={control} setValue={setValue} />
          <ServiceTransformersSection formProps={form} />
        </SectionList>
        <FormActionBar form={form} />
      </form>
    </OriginalModelProvider>
  );
}
