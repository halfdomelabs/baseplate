import type React from 'react';

import { useBlockUnsavedChangesNavigate } from '@baseplate-dev/project-builder-lib/web';
import { FormActionBar, SectionList } from '@baseplate-dev/ui-components';
import { createFileRoute } from '@tanstack/react-router';

import { EditedModelContextProvider } from '../-hooks/use-edited-model-config.js';
import { useModelForm } from '../-hooks/use-model-form.js';
import { GraphQLMutationsSection } from './-components/graphql/graph-ql-mutations-section.js';
import { GraphQLObjectTypeSection } from './-components/graphql/graph-ql-object-type-section.js';
import { GraphQLQueriesSection } from './-components/graphql/graph-ql-queries-section.js';

export const Route = createFileRoute('/data/models/edit/$key/graphql')({
  component: ModelEditGraphQLPage,
  beforeLoad: () => ({
    getTitle: () => 'GraphQL',
  }),
});

function ModelEditGraphQLPage(): React.JSX.Element {
  const { key } = Route.useParams();
  const { form, onSubmit, originalModel } = useModelForm({
    omit: ['name', 'featureRef'],
    modelKey: key,
  });

  const { control, watch, getValues, reset } = form;

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <EditedModelContextProvider
      originalModel={originalModel}
      getValues={getValues}
      watch={watch}
    >
      <form onSubmit={onSubmit} className="space-y-4 p-4">
        <SectionList>
          <GraphQLObjectTypeSection control={control} />
          <GraphQLQueriesSection control={control} />
          <GraphQLMutationsSection control={control} modelKey={key} />
          <FormActionBar form={form} />
        </SectionList>
      </form>
    </EditedModelContextProvider>
  );
}
