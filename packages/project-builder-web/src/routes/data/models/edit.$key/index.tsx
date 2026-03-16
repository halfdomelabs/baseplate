import type React from 'react';

import { useBlockUnsavedChangesNavigate } from '@baseplate-dev/project-builder-lib/web';
import { FormActionBar, SectionList } from '@baseplate-dev/ui-components';
import { createFileRoute } from '@tanstack/react-router';

import { ErrorBoundary } from '#src/components/index.js';

import { useModelForm } from '../-hooks/use-model-form.js';
import { OriginalModelProvider } from '../-hooks/use-original-model.js';
import { ModelFieldsForm } from './-components/fields/model-fields-form.js';
import { ModelIndexesSection } from './-components/model-indexes-section.js';
import { ModelRelationsSection } from './-components/model-relations-section.js';
import { ModelUniqueConstraintsSection } from './-components/model-unique-constraints-section.js';

export const Route = createFileRoute('/data/models/edit/$key/')({
  component: ModelEditModelPage,
});

function ModelEditModelPage(): React.JSX.Element {
  const { key } = Route.useParams();
  const { form, onSubmit, originalModel } = useModelForm({
    omit: ['name', 'featureRef'],
    modelKey: key,
  });
  const { control, setValue, reset } = form;

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  // TODO: Add validation for fields form where:
  // - referenced type does not match field type
  // - SET NULL is on non-optional fields

  return (
    <ErrorBoundary>
      <OriginalModelProvider model={originalModel}>
        <form
          onSubmit={onSubmit}
          className="max-w-7xl min-w-[700px] flex-1 space-y-4 px-4 pb-4"
        >
          <ModelFieldsForm control={control} setValue={setValue} />
          <SectionList>
            <ModelRelationsSection control={control} />
            <ModelUniqueConstraintsSection control={control} />
            <ModelIndexesSection control={control} />
          </SectionList>
          <FormActionBar form={form} />
        </form>
      </OriginalModelProvider>
    </ErrorBoundary>
  );
}
