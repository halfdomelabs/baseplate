import type React from 'react';

import { createModelBaseSchema } from '@baseplate-dev/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@baseplate-dev/project-builder-lib/web';
import { FormActionBar, SectionList } from '@baseplate-dev/ui-components';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

import { EditedModelContextProvider } from '../../_hooks/use-edited-model-config.js';
import { useModelForm } from '../../_hooks/use-model-form.js';
import { GraphQLMutationsSection } from './_components/graphql/graph-ql-mutations-section.js';
import { GraphQLObjectTypeSection } from './_components/graphql/graph-ql-object-type-section.js';
import { GraphQLQueriesSection } from './_components/graphql/graph-ql-queries-section.js';

function ModelEditGraphQLPage(): React.JSX.Element {
  const formSchema = useDefinitionSchema(createModelBaseSchema);
  const { form, onSubmit, defaultValues } = useModelForm({
    schema: formSchema.omit({
      name: true,
      featureRef: true,
    }),
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
