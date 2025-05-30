import type React from 'react';

import { modelBaseSchema } from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';
import { FormActionBar, SectionList } from '@halfdomelabs/ui-components';

import { EditedModelContextProvider } from '../../_hooks/useEditedModelConfig.js';
import { useModelForm } from '../../_hooks/useModelForm.js';
import { GraphQLMutationsSection } from './_components/graphql/GraphQLMutationsSection.js';
import { GraphQLObjectTypeSection } from './_components/graphql/GraphQLObjectTypeSection.js';
import { GraphQLQueriesSection } from './_components/graphql/GraphQLQueriesSection.js';

const formSchema = modelBaseSchema.omit({ name: true, featureRef: true });

function ModelEditGraphQLPage(): React.JSX.Element {
  const { form, onSubmit, defaultValues } = useModelForm({
    schema: formSchema,
  });

  const { control, watch, getValues, reset } = form;

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <EditedModelContextProvider
      initialModel={defaultValues}
      getValues={getValues}
      watch={watch}
    >
      <form onSubmit={onSubmit} className="space-y-4 p-4">
        <SectionList>
          <GraphQLObjectTypeSection control={control} />
          <GraphQLQueriesSection control={control} />
          <GraphQLMutationsSection control={control} />
          <FormActionBar form={form} />
        </SectionList>
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditGraphQLPage;
