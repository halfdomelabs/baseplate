import type React from 'react';

import {
  createModelBaseSchema,
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
} from '@baseplate-dev/project-builder-lib/web';
import { FormActionBar, SectionList } from '@baseplate-dev/ui-components';

import { ErrorBoundary } from '#src/components/index.js';
import { registerEntityTypeUrl } from '#src/services/entity-type.js';

import { EditedModelContextProvider } from '../../_hooks/use-edited-model-config.js';
import { useModelForm } from '../../_hooks/use-model-form.js';
import { ModelFieldsForm } from './_components/fields/model-fields-form.js';
import { ModelRelationsSection } from './_components/model-relations-section.js';
import { ModelUniqueConstraintsSection } from './_components/model-unique-constraints-section.js';

registerEntityTypeUrl(modelEntityType, `/data/models/edit/{key}`);
registerEntityTypeUrl(
  modelScalarFieldEntityType,
  `/data/models/edit/{parentKey}`,
);
registerEntityTypeUrl(
  modelLocalRelationEntityType,
  `/data/models/edit/{parentKey}`,
);

function ModelEditModelPage(): React.JSX.Element {
  const formSchema = useDefinitionSchema(createModelBaseSchema);
  const { form, onSubmit, defaultValues } = useModelForm({
    schema: formSchema.omit({ name: true, featureRef: true }),
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
