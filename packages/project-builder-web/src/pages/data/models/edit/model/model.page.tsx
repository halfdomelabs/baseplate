import {
  ModelUtils,
  modelBaseSchema,
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { useParams } from 'react-router-dom';

import ModelPrimaryKeyForm from './ModelPrimaryKeyForm';
import { ModelRelationsForm } from './ModelRelationsForm';
import ModelUniqueConstraintsField from './ModelUniqueConstraintsField';
import { ModelFieldsForm } from './fields/ModelFieldsForm';
import { EditedModelContextProvider } from '../../hooks/useEditedModelConfig';
import { useModelForm } from '../../hooks/useModelForm';
import ModelFormActionBar from '../ModelFormActionBar';
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
  const { form, onFormSubmit, defaultValues } = useModelForm({
    schema: modelBaseSchema.omit({ name: true, feature: true }),
  });
  const { control, watch, getValues, setValue } = form;
  const { definition } = useProjectDefinition();
  const { uid } = useParams<'uid'>();

  const id = modelEntityType.fromUid(uid);
  const originalModel = ModelUtils.byIdOrThrow(definition, id ?? '');

  useBlockUnsavedChangesNavigate(form.formState, {
    reset: form.reset,
    onSubmit: onFormSubmit,
  });

  return (
    <EditedModelContextProvider
      initialModel={defaultValues}
      getValues={getValues}
      watch={watch}
    >
      <form
        onSubmit={onFormSubmit}
        className="min-w-[700px] max-w-7xl flex-1 space-y-4 px-4 pb-4"
      >
        <ModelFieldsForm control={control} setValue={setValue} />
        <ModelRelationsForm control={control} originalModel={originalModel} />
        <ModelPrimaryKeyForm control={control} />
        <ModelUniqueConstraintsField control={control} />
        <ModelFormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditModelPage;
