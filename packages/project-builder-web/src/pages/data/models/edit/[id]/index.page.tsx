import type React from 'react';

import {
  modelBaseSchema,
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';
import { SectionList } from '@halfdomelabs/ui-components';

import { ErrorBoundary, FormActionBar } from '@src/components';
import { registerEntityTypeUrl } from '@src/services/entity-type';

import { EditedModelContextProvider } from '../../_hooks/useEditedModelConfig';
import { useModelForm } from '../../_hooks/useModelForm';
import { ModelFieldsForm } from './_components/fields/ModelFieldsForm';
import { ModelRelationsSection } from './_components/ModelRelationsSection';
import { ModelUniqueConstraintsSection } from './_components/ModelUniqueConstraintsSection';

registerEntityTypeUrl(modelEntityType, `/data/models/edit/{uid}`);
registerEntityTypeUrl(
  modelScalarFieldEntityType,
  `/data/models/edit/{parentUid}`,
);
registerEntityTypeUrl(
  modelLocalRelationEntityType,
  `/data/models/edit/{parentUid}`,
);

function ModelEditModelPage(): React.JSX.Element {
  const { form, onSubmit, defaultValues } = useModelForm({
    schema: modelBaseSchema.omit({ name: true, featureRef: true }),
  });
  const { control, watch, getValues, setValue, reset } = form;

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

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
          className="max-w-7xl min-w-[700px] flex-1 space-y-4 px-4 pb-4"
        >
          <ModelFieldsForm control={control} setValue={setValue} />
          <SectionList>
            <ModelRelationsSection control={control} setValue={setValue} />
            <ModelUniqueConstraintsSection
              control={control}
              setValue={setValue}
            />
          </SectionList>
          <FormActionBar form={form} />
        </form>
      </EditedModelContextProvider>
    </ErrorBoundary>
  );
}

export default ModelEditModelPage;
