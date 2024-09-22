import {
  modelBaseSchema,
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';
import { SectionList } from '@halfdomelabs/ui-components';

import { ModelRelationsSection } from './ModelRelationsSection';
import { ModelUniqueConstraintsSection } from './ModelUniqueConstraintsSection';
import { ModelFieldsForm } from './fields/ModelFieldsForm';
import { EditedModelContextProvider } from '../../hooks/useEditedModelConfig';
import { useModelForm } from '../../hooks/useModelForm';
import { ErrorBoundary } from '@src/components/ErrorBoundary/ErrorBoundary';
import DataFormActionBar from '@src/pages/data/components/DataFormActionBar';
import { registerEntityTypeUrl } from 'src/services/entity-type';

registerEntityTypeUrl(modelEntityType, `/data/models/edit/{uid}`);
registerEntityTypeUrl(
  modelScalarFieldEntityType,
  `/data/models/edit/{parentUid}`,
);
registerEntityTypeUrl(
  modelLocalRelationEntityType,
  `/data/models/edit/{parentUid}`,
);

function ModelEditModelPage(): JSX.Element {
  const { form, onSubmit, defaultValues } = useModelForm({
    schema: modelBaseSchema.omit({ name: true, feature: true }),
  });
  const { control, watch, getValues, setValue } = form;

  useBlockUnsavedChangesNavigate(form.formState, {
    reset: form.reset,
    onSubmit,
  });

  // TODO: Add validation for fields form where:
  // - referenced type does not match field type
  // - SET NULL is on non-optional fields

  return (
    <ErrorBoundary>
      <EditedModelContextProvider
        initialModel={defaultValues}
        getValues={getValues}
        watch={watch}
      >
        <form
          onSubmit={onSubmit}
          className="mx-4 min-w-[700px] max-w-7xl flex-1 space-y-4 pb-4"
        >
          <ModelFieldsForm control={control} setValue={setValue} />
          <SectionList>
            <ModelRelationsSection control={control} setValue={setValue} />
            <ModelUniqueConstraintsSection
              control={control}
              setValue={setValue}
            />
          </SectionList>
          <DataFormActionBar form={form} />
        </form>
      </EditedModelContextProvider>
    </ErrorBoundary>
  );
}

export default ModelEditModelPage;
