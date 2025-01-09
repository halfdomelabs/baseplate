import type React from 'react';

import { modelBaseSchema } from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';

import FormActionBar from '@src/components/FormActionBar';

import { EditedModelContextProvider } from '../_hooks/useEditedModelConfig';
import { useModelForm } from '../_hooks/useModelForm';
import { GraphQLMutationsSection } from './_components/graphql/GraphQLMutationsSection';
import { GraphQLObjectTypeSection } from './_components/graphql/GraphQLObjectTypeSection';
import { GraphQLQueriesSection } from './_components/graphql/GraphQLQueriesSection';

function ModelEditGraphQLPage(): React.JSX.Element {
  const { form, onSubmit, defaultValues } = useModelForm({
    schema: modelBaseSchema.omit({ name: true, feature: true }),
  });

  useBlockUnsavedChangesNavigate(form.formState, {
    reset: form.reset,
    onSubmit,
  });

  const { control, watch, getValues } = form;

  return (
    <EditedModelContextProvider
      initialModel={defaultValues}
      getValues={getValues}
      watch={watch}
    >
      <form onSubmit={onSubmit} className="space-y-4 p-4">
        <GraphQLObjectTypeSection control={control} />
        <GraphQLQueriesSection control={control} />
        <GraphQLMutationsSection control={control} />
        <FormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditGraphQLPage;
