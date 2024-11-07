import { modelBaseSchema } from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';

import { GraphQLMutationsSection } from './GraphQLMutationsSection';
import { GraphQLObjectTypeSection } from './GraphQLObjectTypeSection';
import { GraphQLQueriesSection } from './GraphQLQueriesSection';
import { EditedModelContextProvider } from '../../hooks/useEditedModelConfig';
import { useModelForm } from '../../hooks/useModelForm';
import FormActionBar from '@src/components/FormActionBar';

function ModelEditGraphQLPage(): JSX.Element {
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
