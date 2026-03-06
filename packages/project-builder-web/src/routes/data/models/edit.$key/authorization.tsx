import type React from 'react';

import { useBlockUnsavedChangesNavigate } from '@baseplate-dev/project-builder-lib/web';
import { FormActionBar, SectionList } from '@baseplate-dev/ui-components';
import { createFileRoute } from '@tanstack/react-router';

import { useModelForm } from '../-hooks/use-model-form.js';
import { OriginalModelProvider } from '../-hooks/use-original-model.js';
import { ModelAuthorizerRolesSection } from './-components/authorizer/model-authorizer-roles-section.js';

export const Route = createFileRoute('/data/models/edit/$key/authorization')({
  component: ModelEditAuthorizationPage,
  beforeLoad: () => ({
    getTitle: () => 'Authorization',
  }),
});

function ModelEditAuthorizationPage(): React.JSX.Element {
  const { key } = Route.useParams();
  const { form, onSubmit, originalModel } = useModelForm({
    omit: ['name', 'featureRef'],
    modelKey: key,
  });
  const { control, reset } = form;

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <OriginalModelProvider model={originalModel}>
      <form onSubmit={onSubmit} className="w-full max-w-7xl space-y-4 p-4">
        <SectionList>
          <ModelAuthorizerRolesSection formProps={form} />
        </SectionList>
        <FormActionBar form={form} />
      </form>
    </OriginalModelProvider>
  );
}
